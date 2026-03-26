/**
 * OpenRouteService Integration
 * Handles all route generation and distance/ETA calculations
 */

class OpenRouteServiceClient {
  constructor(apiKey = null) {
    // OpenRouteService API Key
    this.apiKey = apiKey || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjI0NTVhMTAyNGJkZDRjODk5ZTQyZjc1MDVmMzhlYTJhIiwiaCI6Im11cm11cjY0In0';
    this.baseUrl = 'https://api.openrouteservice.org/v2';
    this.cache = new Map();
  }

  /**
   * Get route between multiple waypoints
   * @param {array} waypoints - Array of [lng, lat] coordinates (ORS format)
   * @param {object} options - Request options
   * @returns {Promise<object>} - Route data with GeoJSON and summary
   */
  async getRoute(waypoints, options = {}) {
    const cacheKey = JSON.stringify({ waypoints, options });

    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const defaultOptions = {
      profile: 'driving-car', // Options: driving-car, foot, cycling-electric
      format: 'geojson',
      instructions: true,
      language: 'en',
      geometry: true,
      continue_straight: true,
      elevation: false,
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const url = `${this.baseUrl}/directions/${finalOptions.profile}`;

      const requestBody = {
        coordinates: waypoints,
        format: finalOptions.format,
        instructions: finalOptions.instructions,
        language: finalOptions.language,
        geometry: finalOptions.geometry,
        continue_straight: finalOptions.continue_straight,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`ORS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Parse route data
      const routeResult = this.parseRouteResponse(data);

      // Cache result
      this.cache.set(cacheKey, routeResult);

      return routeResult;
    } catch (error) {
      console.error('Error fetching route from ORS:', error);
      throw error;
    }
  }

  /**
   * Get route and convert to Leaflet format
   * @param {array} waypoints - Array of [lng, lat] coordinates
   * @param {object} options - Route options
   * @returns {Promise<object>} - Leaflet-formatted route data
   */
  async getLeafletRoute(waypoints, options = {}) {
    const routeData = await this.getRoute(waypoints, options);
    return this.convertToLeafletFormat(routeData);
  }

  /**
   * Parse ORS response into usable format
   * @param {object} data - ORS API response
   * @returns {object} - Parsed route data
   */
  parseRouteResponse(data) {
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const summary = route.summary || {};
    const geometry = route.geometry;

    return {
      geometry: geometry, // GeoJSON
      distance: summary.distance || 0, // in meters
      duration: summary.duration || 0, // in seconds
      routes: data.routes,
      waypoints: data.waypoints || [],
      instructions: route.instructions || [],
    };
  }

  /**
   * Convert ORS route to Leaflet format
   * @param {object} routeData - Parsed route data
   * @returns {object} - Leaflet-formatted data
   */
  convertToLeafletFormat(routeData) {
    // Convert GeoJSON coordinates from [lng, lat] to [lat, lng]
    const leafletCoordinates = routeData.geometry.coordinates.map((coord) => [
      coord[1],
      coord[0],
    ]);

    return {
      coordinates: leafletCoordinates, // [lat, lng] format for Leaflet
      geojson: this.swapGeoJsonCoordinates(routeData.geometry),
      distance: routeData.distance,
      duration: routeData.duration,
      instructions: routeData.instructions,
      durationMinutes: Math.round(routeData.duration / 60),
      distanceKm: (routeData.distance / 1000).toFixed(2),
    };
  }

  /**
   * Swap GeoJSON coordinates from [lng, lat] to [lat, lng]
   * @param {object} geometry - GeoJSON geometry object
   * @returns {object} - Converted GeoJSON
   */
  swapGeoJsonCoordinates(geometry) {
    if (geometry.type === 'LineString') {
      return {
        ...geometry,
        coordinates: geometry.coordinates.map((coord) => [coord[1], coord[0]]),
      };
    } else if (geometry.type === 'MultiLineString') {
      return {
        ...geometry,
        coordinates: geometry.coordinates.map((line) =>
          line.map((coord) => [coord[1], coord[0]])
        ),
      };
    }
    return geometry;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * @param {array} coord1 - [lat, lng]
   * @param {array} coord2 - [lat, lng]
   * @returns {number} - Distance in kilometers
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = (this.toRad(coord2[0]) - this.toRad(coord1[0])) / 2;
    const dLon = (this.toRad(coord2[1]) - this.toRad(coord1[1])) / 2;

    const a =
      Math.sin(dLat) * Math.sin(dLat) +
      Math.cos(this.toRad(coord1[0])) *
        Math.cos(this.toRad(coord2[0])) *
        Math.sin(dLon) *
        Math.sin(dLon);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} - Radians
   */
  toRad(deg) {
    return (deg * Math.PI) / 180;
  }

  /**
   * Calculate ETA based on distance and speed
   * @param {number} distanceKm - Distance in kilometers
   * @param {number} speedKmh - Speed in km/h
   * @returns {number} - ETA in minutes
   */
  calculateETA(distanceKm, speedKmh = 20) {
    return Math.round((distanceKm / speedKmh) * 60);
  }

  /**
   * Generate way markers for stops along route
   * @param {array} stops - Array of stop objects with coordinates
   * @returns {array} - Array of [lng, lat] for ORS format
   */
  generateWaypoints(stops) {
    return stops.map((stop) => [stop.lng || stop.longitude, stop.lat || stop.latitude]);
  }

  /**
   * Get instructions for route
   * @param {array} instructions - ORS instructions array
   * @returns {array} - Formatted instructions
   */
  formatInstructions(instructions) {
    return instructions.map((instruction, index) => ({
      step: index + 1,
      text: instruction.text || '',
      distance: instruction.distance || 0,
      duration: instruction.duration || 0,
      distanceKm: (instruction.distance / 1000).toFixed(2),
      durationMinutes: Math.round(instruction.duration / 60),
    }));
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   * @returns {number} - Number of cached routes
   */
  getCacheSize() {
    return this.cache.size;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OpenRouteServiceClient;
}
