/**
 * Driver Route Dashboard
 * Manages driver navigation view with route visualization
 */

class DriverRouteDashboard {
  constructor(options = {}) {
    this.options = {
      containerId: 'driver-map-container',
      autoZoom: true,
      zoomLevel: 16,
      ...options,
    };
    this.map = null;
    this.markers = [];
    this.polylines = [];
    this.stops = [];
  }

  async initialize(stops, apiKey) {
    this.stops = stops;

    // Wait for Leaflet to be available
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded');
      return;
    }

    const container = document.getElementById(this.options.containerId);
    if (!container) {
      console.error(`Container ${this.options.containerId} not found`);
      return;
    }

    // Remove any existing map instance
    if (this.map) {
      this.map.remove();
    }

    // Ensure container has dimensions
    if (!container.style.height) {
      container.style.height = '100%';
    }
    if (!container.style.width) {
      container.style.width = '100%';
    }

    // Initialize map
    const defaultCenter = stops.length > 0 ? [stops[0].lat || 20.5937, stops[0].lng || 78.9629] : [20.5937, 78.9629];
    this.map = L.map(this.options.containerId).setView(defaultCenter, this.options.zoomLevel);
    
    // Force map to recalculate size
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);

    // Add base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Add markers for each stop
    this.addMarkers(stops);

    // Draw route
    if (stops.length >= 2) {
      await this.drawRoute(stops, apiKey);
    }

    // Adjust map bounds
    if (this.options.autoZoom && this.markers.length > 0) {
      const group = new L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  addMarkers(stops) {
    stops.forEach((stop, index) => {
      const lat = stop.lat || stop.latitude;
      const lng = stop.lng || stop.longitude;

      if (!lat || !lng) {
        console.warn(`Stop ${index} missing coordinates:`, stop);
        return;
      }

      const isStart = index === 0;
      const isEnd = index === stops.length - 1;
      let markerColor = '#10b981'; // green for waypoints

      if (isStart) {
        markerColor = '#10b981'; // green for start
      } else if (isEnd) {
        markerColor = '#ef4444'; // red for end
      }

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: markerColor,
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(this.map);

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px;">
          <strong>${stop.name || `Stop ${index + 1}`}</strong>
          <br/>
          ${stop.address || 'Unknown location'}
          <br/>
          <small style="color: #666;">${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
        </div>
      `;
      marker.bindPopup(popupContent);

      this.markers.push(marker);
    });
  }

  async drawRoute(stops, apiKey) {
    const coordinates = stops
      .filter(s => s.lng && s.lat)
      .map(s => `${s.lng},${s.lat}`)
      .join('|');

    if (!coordinates || coordinates.split('|').length < 2) {
      console.warn('Not enough coordinates for route');
      return;
    }

    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving?api_key=${apiKey}&coordinates=${coordinates}`,
        { headers: { Accept: 'application/geo+json' } }
      );

      if (!response.ok) {
        console.error('Route request failed:', response.statusText);
        return;
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const route = data.features[0].geometry.coordinates;
        const routePath = route.map(coord => [coord[1], coord[0]]); // [lat, lng]

        const polyline = L.polyline(routePath, {
          color: '#10b981',
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 5',
        }).addTo(this.map);

        this.polylines.push(polyline);
      }
    } catch (error) {
      console.error('Error drawing route:', error);
    }
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = [];
    this.polylines = [];
  }

  updateDriverLocation(lat, lng, heading) {
    // This would be called to update driver position in real-time
    if (!this.driverMarker && this.map) {
      this.driverMarker = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: '#3b82f6',
        color: 'white',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(this.map);
    } else if (this.driverMarker) {
      this.driverMarker.setLatLng([lat, lng]);
    }
  }
}
