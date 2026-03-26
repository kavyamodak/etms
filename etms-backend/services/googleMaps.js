import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
    console.error("❌ GOOGLE_MAPS_API_KEY is missing in .env");
}

/**
 * Geocode an address to lat/lng
 */
export async function geocodeAddress(address) {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

    const resp = await fetch(url.toString());
    const data = await resp.json();

    if (data.status !== 'OK') {
        throw new Error(`Geocoding failed for "${address}": ${data.status}`);
    }

    const location = data.results[0].geometry.location;
    return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: data.results[0].formatted_address
    };
}

/**
 * Get distance and duration between origin and destination
 */
export async function getDistanceMatrix(origin, destination) {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', origin);
    url.searchParams.set('destinations', destination);
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

    const resp = await fetch(url.toString());
    const data = await resp.json();

    if (data.status !== 'OK') {
        throw new Error(`Distance Matrix failed: ${data.status}`);
    }

    const element = data.rows[0].elements[0];
    if (element.status !== 'OK') {
        throw new Error(`Distance Matrix element failed: ${element.status}`);
    }

    return {
        distanceMeters: element.distance.value,
        durationSeconds: element.duration.value,
        distanceText: element.distance.text,
        durationText: element.duration.text
    };
}

/**
 * Get directions and polyline for a route
 */
export async function getDirections(origin, destination, waypoints = []) {
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', origin);
    url.searchParams.set('destination', destination);
    if (waypoints.length > 0) {
        url.searchParams.set('waypoints', waypoints.join('|'));
    }
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

    const resp = await fetch(url.toString());
    const data = await resp.json();

    if (data.status !== 'OK') {
        throw new Error(`Directions failed: ${data.status}`);
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
        polyline: route.overview_polyline.points,
        distanceMeters: leg.distance.value,
        durationSeconds: leg.duration.value,
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        startLocation: leg.start_location,
        endLocation: leg.end_location
    };
}
