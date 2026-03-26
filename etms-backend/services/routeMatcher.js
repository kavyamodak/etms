import { getDistanceMatrix, geocodeAddress } from './googleMaps.js';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || null;

/**
 * Calculate distance between two locations.
 */
export async function getDistance(origin, destination) {
    if (GOOGLE_MAPS_API_KEY) {
        try {
            return await getDistanceMatrix(origin, destination);
        } catch (err) {
            console.error("Google Maps Distance failed, falling back:", err.message);
        }
    }
    return getDistanceViaTextSimilarity(origin, destination);
}

/**
 * Text-similarity fallback.
 */
function getDistanceViaTextSimilarity(origin, destination) {
    return Promise.resolve({
        distanceMeters: 999999,
        durationSeconds: 0,
        method: 'text_fallback',
    });
}

function normalise(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function similarity(a, b) {
    const setA = new Set(normalise(a).split(/\s+/));
    const setB = new Set(normalise(b).split(/\s+/));
    const intersection = [...setA].filter(t => setB.has(t)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
}

export function findBestRoute({
    startLocation,
    endLocation,
    scheduledTime,
    activeRoutes,
    vehicleCapacities,
}) {
    if (!activeRoutes || activeRoutes.length === 0) {
        return { matchType: 'new', route: null, score: 0 };
    }

    const MATCH_THRESHOLD = 0.4;
    const TIME_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours window
    let bestRoute = null;
    let bestScore = -1;

    const reqTime = scheduledTime ? new Date(scheduledTime).getTime() : null;

    for (const route of activeRoutes) {
        // 1. Capacity Check
        const passengers = vehicleCapacities[route.id] || 0;
        const capacity = route.vehicle_capacity || Infinity;
        if (passengers >= capacity) continue;

        // 2. Time Check
        if (reqTime && route.scheduled_time) {
            const routeTime = new Date(route.scheduled_time).getTime();
            if (Math.abs(reqTime - routeTime) > TIME_WINDOW_MS) continue;
        }

        const startScore = similarity(startLocation, route.start_location);
        const endScore = similarity(endLocation, route.end_location);
        
        // 3. Waypoint Similarity (If request is between existing points)
        let waypointScore = 0;
        if (Array.isArray(route.waypoints) && route.waypoints.length > 0) {
            const hasStartInWaypoints = route.waypoints.some(w => similarity(startLocation, w) > 0.7);
            const hasEndInWaypoints = route.waypoints.some(w => similarity(endLocation, w) > 0.7);
            if (hasStartInWaypoints || hasEndInWaypoints) waypointScore = 0.5;
        }

        const score = (startScore + endScore) / 2 + waypointScore;

        if (score > bestScore) {
            bestScore = score;
            bestRoute = route;
        }
    }

    if (bestRoute && bestScore >= MATCH_THRESHOLD) {
        return { matchType: 'existing', route: bestRoute, score: bestScore };
    }
    return { matchType: 'new', route: null, score: bestScore };
}

export async function findBestRouteWithMaps({
    startLocation,
    endLocation,
    scheduledTime,
    activeRoutes,
    vehicleCapacities,
}) {
    if (!GOOGLE_MAPS_API_KEY || !activeRoutes || activeRoutes.length === 0) {
        return findBestRoute({ startLocation, endLocation, scheduledTime, activeRoutes, vehicleCapacities });
    }

    const MAX_DETOUR_METERS = 5000;
    const TIME_WINDOW_MS = 2 * 60 * 60 * 1000;
    let bestRoute = null;
    let bestDetour = Infinity;

    const reqTime = scheduledTime ? new Date(scheduledTime).getTime() : null;

    for (const route of activeRoutes) {
        const passengers = vehicleCapacities[route.id] || 0;
        const capacity = route.vehicle_capacity || Infinity;
        if (passengers >= capacity) continue;

        // Time Check
        if (reqTime && route.scheduled_time) {
            const routeTime = new Date(route.scheduled_time).getTime();
            if (Math.abs(reqTime - routeTime) > TIME_WINDOW_MS) continue;
        }

        try {
            // Check distance to Start/End
            const startDist = await getDistanceMatrix(startLocation, route.start_location);
            const endDist = await getDistanceMatrix(endLocation, route.end_location);
            let totalDetour = startDist.distanceMeters + endDist.distanceMeters;

            // Optional: Check if location is near any intermediate waypoints
            if (Array.isArray(route.waypoints) && route.waypoints.length > 0) {
                for (const wp of route.waypoints) {
                    const wpDist = await getDistanceMatrix(startLocation, wp);
                    if (wpDist.distanceMeters < 2000) { // If within 2km of a waypoint
                        totalDetour = Math.min(totalDetour, wpDist.distanceMeters + endDist.distanceMeters);
                    }
                }
            }

            if (totalDetour < bestDetour) {
                bestDetour = totalDetour;
                bestRoute = route;
            }
        } catch (e) {
            continue;
        }
    }

    if (bestRoute && bestDetour <= MAX_DETOUR_METERS) {
        return { matchType: 'existing', route: bestRoute, score: 1 - bestDetour / MAX_DETOUR_METERS };
    }
    return { matchType: 'new', route: null, score: 0 };
}

export const mapsEnabled = !!GOOGLE_MAPS_API_KEY;
