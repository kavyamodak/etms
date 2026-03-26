/**
 * Admin Route Dashboard
 * Manages admin view of routes with full control and details
 */

class AdminRouteDashboard {
  constructor(options = {}) {
    this.options = {
      containerId: 'admin-map-container',
      autoZoom: true,
      zoomLevel: 14,
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
      let markerColor = '#06b6d4'; // cyan for waypoints
      let markerSize = 6;

      if (isStart) {
        markerColor = '#10b981'; // green for start
        markerSize = 10;
      } else if (isEnd) {
        markerColor = '#ef4444'; // red for end
        markerSize = 10;
      }

      const marker = L.circleMarker([lat, lng], {
        radius: markerSize,
        fillColor: markerColor,
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(this.map);

      let statusLabel = `Stop ${index + 1}`;
      if (isStart) statusLabel = 'Start';
      if (isEnd) statusLabel = 'End';

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; min-width: 200px;">
          <strong style="font-size: 14px; color: #111;">${stop.name || statusLabel}</strong>
          <br/>
          <span style="color: #555;">${stop.address || 'Unknown location'}</span>
          <br/>
          <small style="color: #999;">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>
          ${stop.status ? `<br/><small style="color: #10b981;"><strong>Status:</strong> ${stop.status}</small>` : ''}
          ${stop.passengerName ? `<br/><small><strong>Passenger:</strong> ${stop.passengerName}</small>` : ''}
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
          color: '#0ea5e9',
          weight: 4,
          opacity: 0.8,
          className: 'admin-route-line',
        }).addTo(this.map);

        this.polylines.push(polyline);

        // Add distance information if available
        if (data.features[0].properties && data.features[0].properties.segments) {
          const totalDistance = data.features[0].properties.segments.reduce((sum, seg) => sum + seg.distance, 0);
          const totalDuration = data.features[0].properties.segments.reduce((sum, seg) => sum + seg.duration, 0);
          
          this.routeStats = {
            distance: (totalDistance / 1000).toFixed(2),
            duration: Math.round(totalDuration / 60),
          };
        }
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

  getRouteStats() {
    return this.routeStats || { distance: '?', duration: '?' };
  }

  updateDriverLocation(lat, lng, heading) {
    // Real-time tracking for admin view
    if (!this.driverMarker && this.map) {
      this.driverMarker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: '#f59e0b',
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(this.map);
    } else if (this.driverMarker) {
      this.driverMarker.setLatLng([lat, lng]);
    }
  }
}
