/**
 * Leaflet Map Service
 * Handles all Leaflet map operations and utilities
 */

class LeafletMapService {
  constructor() {
    this.map = null;
    this.markers = {};
    this.polylines = {};
    this.popups = {};
    this.routeGroup = null;
    this.driverMarker = null;
  }

  /**
   * Initialize the Leaflet map
   * @param {string} containerId - ID of the map container
   * @param {object} options - Leaflet map options
   * @returns {L.Map} - Leaflet map instance
   */
  initializeMap(containerId, options = {}) {
    const defaultOptions = {
      center: [28.6139, 77.2090], // Default to Delhi
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Initialize map
    this.map = L.map(containerId, {
      center: finalOptions.center,
      zoom: finalOptions.zoom,
      zoomControl: finalOptions.zoomControl,
      attributionControl: finalOptions.attributionControl,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // Initialize route group for layers
    this.routeGroup = L.featureGroup().addTo(this.map);

    return this.map;
  }

  /**
   * Add a marker to the map
   * @param {string} id - Unique marker ID
   * @param {array} coords - [lat, lng] coordinates
   * @param {object} options - Marker options
   * @returns {L.Marker} - Leaflet marker instance
   */
  addMarker(id, coords, options = {}) {
    const defaultOptions = {
      title: 'Marker',
      icon: L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      }),
    };

    const finalOptions = { ...defaultOptions, ...options };
    const marker = L.marker(coords, {
      title: finalOptions.title,
      icon: finalOptions.icon,
      draggable: finalOptions.draggable || false,
    }).addTo(this.map);

    this.markers[id] = marker;
    return marker;
  }

  /**
   * Add a polyline route to the map
   * @param {string} id - Unique route ID
   * @param {array} coordinates - Array of [lat, lng] coordinates
   * @param {object} options - Polyline options
   * @returns {L.Polyline} - Leaflet polyline instance
   */
  addPolyline(id, coordinates, options = {}) {
    const defaultOptions = {
      color: '#3498db',
      weight: 4,
      opacity: 0.8,
      dashArray: null,
      lineCap: 'round',
      lineJoin: 'round',
      smoothFactor: 1.0,
    };

    const finalOptions = { ...defaultOptions, ...options };

    const polyline = L.polyline(coordinates, {
      color: finalOptions.color,
      weight: finalOptions.weight,
      opacity: finalOptions.opacity,
      dashArray: finalOptions.dashArray,
      lineCap: finalOptions.lineCap,
      lineJoin: finalOptions.lineJoin,
      smoothFactor: finalOptions.smoothFactor,
    }).addTo(this.routeGroup);

    this.polylines[id] = polyline;
    return polyline;
  }

  /**
   * Add GeoJSON route to map
   * @param {string} id - Unique route ID
   * @param {object} geojson - GeoJSON FeatureCollection
   * @param {object} options - GeoJSON style options
   * @returns {L.GeoJSON} - Leaflet GeoJSON layer
   */
  addGeoJsonRoute(id, geojson, options = {}) {
    const defaultOptions = {
      color: '#3498db',
      weight: 5,
      opacity: 0.8,
    };

    const finalOptions = { ...defaultOptions, ...options };

    const geoJsonLayer = L.geoJSON(geojson, {
      style: {
        color: finalOptions.color,
        weight: finalOptions.weight,
        opacity: finalOptions.opacity,
        lineCap: 'round',
        lineJoin: 'round',
      },
    }).addTo(this.routeGroup);

    this.polylines[id] = geoJsonLayer;
    return geoJsonLayer;
  }

  /**
   * Update marker position (for live tracking)
   * @param {string} id - Marker ID
   * @param {array} newCoords - New [lat, lng] coordinates
   */
  updateMarkerPosition(id, newCoords) {
    if (this.markers[id]) {
      this.markers[id].setLatLng(newCoords);
    }
  }

  /**
   * Add a popup to a marker
   * @param {string} id - Marker ID
   * @param {string} content - Popup HTML content
   */
  addPopupToMarker(id, content) {
    if (this.markers[id]) {
      this.markers[id].bindPopup(content);
    }
  }

  /**
   * Open popup for a marker
   * @param {string} id - Marker ID
   */
  openPopup(id) {
    if (this.markers[id]) {
      this.markers[id].openPopup();
    }
  }

  /**
   * Close all popups
   */
  closeAllPopups() {
    if (this.map) {
      this.map.closePopup();
    }
  }

  /**
   * Fit map to bounds of all markers
   * @param {number} padding - Padding in pixels
   */
  fitMapToBounds(padding = 50) {
    if (this.routeGroup && this.routeGroup.getLayers().length > 0) {
      this.map.fitBounds(this.routeGroup.getBounds(), { padding: [padding, padding] });
    }
  }

  /**
   * Pan map to a specific location
   * @param {array} coords - [lat, lng] coordinates
   * @param {number} zoom - Zoom level
   */
  panToLocation(coords, zoom = 15) {
    if (this.map) {
      this.map.setView(coords, zoom);
    }
  }

  /**
   * Remove a marker from map
   * @param {string} id - Marker ID
   */
  removeMarker(id) {
    if (this.markers[id]) {
      this.map.removeLayer(this.markers[id]);
      delete this.markers[id];
    }
  }

  /**
   * Remove a polyline from map
   * @param {string} id - Polyline ID
   */
  removePolyline(id) {
    if (this.polylines[id]) {
      this.routeGroup.removeLayer(this.polylines[id]);
      delete this.polylines[id];
    }
  }

  /**
   * Clear all markers and polylines
   */
  clearAll() {
    this.routeGroup.clearLayers();
    this.markers = {};
    this.polylines = {};
  }

  /**
   * Add circle to map (for stop radius visualization)
   * @param {string} id - Circle ID
   * @param {array} coords - [lat, lng] coordinates
   * @param {number} radius - Radius in meters
   * @param {object} options - Circle options
   */
  addCircle(id, coords, radius, options = {}) {
    const defaultOptions = {
      color: '#e74c3c',
      fillColor: '#e74c3c',
      fillOpacity: 0.1,
      radius: radius,
    };

    const finalOptions = { ...defaultOptions, ...options };

    const circle = L.circle(coords, {
      color: finalOptions.color,
      fillColor: finalOptions.fillColor,
      fillOpacity: finalOptions.fillOpacity,
      radius: finalOptions.radius,
    }).addTo(this.routeGroup);

    return circle;
  }

  /**
   * Get map instance
   * @returns {L.Map} - Leaflet map instance
   */
  getMap() {
    return this.map;
  }

  /**
   * Get marker by ID
   * @param {string} id - Marker ID
   * @returns {L.Marker} - Leaflet marker instance
   */
  getMarker(id) {
    return this.markers[id];
  }

  /**
   * Get all markers
   * @returns {object} - All markers keyed by ID
   */
  getAllMarkers() {
    return this.markers;
  }

  /**
   * Set map zoom level
   * @param {number} zoom - Zoom level
   */
  setZoom(zoom) {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  /**
   * Get current map center
   * @returns {L.LatLng} - Current center coordinates
   */
  getCenter() {
    return this.map ? this.map.getCenter() : null;
  }

  /**
   * Get current zoom level
   * @returns {number} - Current zoom level
   */
  getZoom() {
    return this.map ? this.map.getZoom() : null;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeafletMapService;
}
