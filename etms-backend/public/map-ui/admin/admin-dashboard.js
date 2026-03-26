/**
 * Admin Route Dashboard
 * Complete route management for administrators
 */

class AdminRouteDashboard {
  constructor(options = {}) {
    this.mapService = null;
    this.routeService = null;
    this.routeTracker = null;
    this.routeData = null;
    this.tripStatus = 'NOT_STARTED'; // NOT_STARTED, IN_PROGRESS, PAUSED, COMPLETED
    this.driverMarker = null;
    this.stops = [];
    this.options = {
      containerId: 'map',
      panelPosition: 'bottom-right',
      autoZoom: true,
      ...options,
    };
  }

  /**
   * Initialize the admin dashboard
   * @param {array} stops - Array of stops with lat/lng and name
   * @param {string} apiKey - OpenRouteService API key
   */
  async initialize(stops, apiKey = null) {
    // Initialize services
    this.mapService = new LeafletMapService();
    this.routeService = new OpenRouteServiceClient(apiKey);
    this.routeTracker = new RouteTracker();
    this.stops = stops;

    // Initialize map
    this.mapService.initializeMap(this.options.containerId, {
      center: [stops[0].lat || stops[0].latitude, stops[0].lng || stops[0].longitude],
      zoom: 14,
    });

    // Generate route
    await this.generateRoute();

    // Setup UI
    this.setupUI();

    // Setup event listeners
    this.setupEventListeners();

    return this;
  }

  /**
   * Generate route using OpenRouteService
   */
  async generateRoute() {
    try {
      const waypoints = this.stops.map((stop) => [
        stop.lng || stop.longitude,
        stop.lat || stop.latitude,
      ]);

      const leafletRoute = await this.routeService.getLeafletRoute(waypoints);

      this.routeData = {
        coordinates: leafletRoute.coordinates,
        distance: leafletRoute.distance,
        duration: leafletRoute.duration,
        distanceKm: leafletRoute.distanceKm,
        durationMinutes: leafletRoute.durationMinutes,
        geojson: leafletRoute.geojson,
      };

      // Draw route on map
      this.drawRoute();

      // Draw stops with markers
      this.drawStops();

      // Initialize tracker
      this.routeTracker.initializeTracking(leafletRoute.coordinates, 40);

      // Fit map to route
      if (this.options.autoZoom) {
        this.mapService.fitMapToBounds();
      }
    } catch (error) {
      console.error('Error generating route:', error);
      this.showError('Failed to generate route');
    }
  }

  /**
   * Draw route polyline on map
   */
  drawRoute() {
    this.mapService.addGeoJsonRoute('main-route', this.routeData.geojson, {
      color: '#3498db',
      weight: 5,
      opacity: 0.8,
    });
  }

  /**
   * Draw stop markers on map
   */
  drawStops() {
    this.stops.forEach((stop, index) => {
      const coords = [stop.lat || stop.latitude, stop.lng || stop.longitude];

      // Create custom icon
      const icon = this.createStopIcon(index, stop.status || 'pending');

      // Add marker
      const marker = this.mapService.addMarker(`stop-${index}`, coords, {
        title: `${stop.name || `Stop ${index + 1}`}`,
        icon: icon,
      });

      // Add popup with stop info
      const popupContent = `
        <div class="stop-popup">
          <h4>${stop.name || `Stop ${index + 1}`}</h4>
          <p><strong>Address:</strong> ${stop.address || 'N/A'}</p>
          <p><strong>Status:</strong> <span class="badge badge-${this.getStatusBadgeClass(stop.status)}">${stop.status || 'pending'}</span></p>
        </div>
      `;

      marker.bindPopup(popupContent);
    });
  }

  /**
   * Create custom stop icon
   */
  createStopIcon(index, status = 'pending') {
    const colors = {
      completed: '#27ae60',
      'in-progress': '#f39c12',
      pending: '#e74c3c',
    };

    const color = colors[status] || colors.pending;

    const html = `
      <div class="stop-icon" style="
        background-color: ${color};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">
        ${index + 1}
      </div>
    `;

    return L.divIcon({
      html: html,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
      className: 'stop-marker',
    });
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status) {
    const classes = {
      completed: 'success',
      'in-progress': 'warning',
      pending: 'danger',
    };
    return classes[status] || 'primary';
  }

  /**
   * Setup UI elements
   */
  setupUI() {
    this.createDetailsPanel();
    this.createControlsPanel();
  }

  /**
   * Create route details panel
   */
  createDetailsPanel() {
    const panel = document.createElement('div');
    panel.className = 'floating-panel route-details-panel top-right';
    panel.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Route Details</h3>
          <span class="status-indicator">
            <span class="status-dot active"></span>
            <span id="trip-status">Not Started</span>
          </span>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="info-label">Total Distance</span>
            <span class="info-value" id="total-distance">${this.routeData.distanceKm} km</span>
          </div>
          <div class="info-row">
            <span class="info-label">Estimated Duration</span>
            <span class="info-value" id="estimated-duration">${this.routeData.durationMinutes} min</span>
          </div>
          <div class="info-row">
            <span class="info-label">Number of Stops</span>
            <span class="info-value" id="total-stops">${this.stops.length}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Trip Progress</span>
            <span class="info-value" id="trip-progress">0%</span>
          </div>
          <div class="info-row">
            <span class="info-label">Driver Location</span>
            <span class="info-value" id="driver-location">Not started</span>
          </div>
          <div class="info-row">
            <span class="info-label">Next Stop</span>
            <span class="info-value" id="next-stop">${this.stops[0].name || 'Stop 1'}</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.detailsPanel = panel;
  }

  /**
   * Create controls panel
   */
  createControlsPanel() {
    const panel = document.createElement('div');
    panel.className = 'floating-panel controls-panel bottom-right';
    panel.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Trip Controls</h4>
        </div>
        <div class="card-body">
          <button class="btn btn-primary btn-lg" id="btn-start-trip" style="width: 100%;">
            <span>▶</span> Start Trip
          </button>
          <button class="btn btn-secondary btn-lg" id="btn-pause-trip" style="width: 100%; display: none;">
            <span>⏸</span> Pause Trip
          </button>
          <button class="btn btn-secondary btn-lg" id="btn-resume-trip" style="width: 100%; display: none;">
            <span>▶</span> Resume Trip
          </button>
          <button class="btn btn-danger btn-lg" id="btn-end-trip" style="width: 100%; display: none;">
            <span>⏹</span> End Trip
          </button>
          <button class="btn btn-secondary btn-lg" id="btn-recenter" style="width: 100%; margin-top: var(--spacing-md);">
            <span>🎯</span> Recenter Map
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.controlsPanel = panel;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.getElementById('btn-start-trip')?.addEventListener('click', () => this.startTrip());
    document.getElementById('btn-pause-trip')?.addEventListener('click', () => this.pauseTrip());
    document.getElementById('btn-resume-trip')?.addEventListener('click', () => this.resumeTrip());
    document.getElementById('btn-end-trip')?.addEventListener('click', () => this.endTrip());
    document.getElementById('btn-recenter')?.addEventListener('click', () => this.recenterMap());

    // Subscribe to tracker updates
    this.routeTracker.updateCallback = (data) => this.onDriverPositionUpdate(data);
  }

  /**
   * Start the trip
   */
  startTrip() {
    if (this.tripStatus !== 'NOT_STARTED') return;

    this.tripStatus = 'IN_PROGRESS';
    this.updateTripStatus();

    // Add driver marker
    this.addDriverMarker();

    // Start simulation
    this.routeTracker.startSimulation(2000); // Update every 2 seconds

    // Update buttons
    this.updateControlButtons();

    console.log('Trip started');
  }

  /**
   * Pause the trip
   */
  pauseTrip() {
    if (this.tripStatus !== 'IN_PROGRESS') return;

    this.tripStatus = 'PAUSED';
    this.updateTripStatus();
    this.routeTracker.stopSimulation();
    this.updateControlButtons();

    console.log('Trip paused');
  }

  /**
   * Resume the trip
   */
  resumeTrip() {
    if (this.tripStatus !== 'PAUSED') return;

    this.tripStatus = 'IN_PROGRESS';
    this.updateTripStatus();
    this.routeTracker.startSimulation(2000);
    this.updateControlButtons();

    console.log('Trip resumed');
  }

  /**
   * End the trip
   */
  endTrip() {
    if (this.tripStatus === 'COMPLETED' || this.tripStatus === 'NOT_STARTED') return;

    this.tripStatus = 'COMPLETED';
    this.updateTripStatus();
    this.routeTracker.stopSimulation();
    this.updateControlButtons();

    // Show completion message
    this.showSuccess('Trip completed successfully!');

    console.log('Trip ended');
  }

  /**
   * Add driver marker to map
   */
  addDriverMarker() {
    const startCoords = this.routeData.coordinates[0];

    const html = `
      <div class="driver-marker" style="
        width: 40px;
        height: 40px;
        background-color: #3498db;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        🚗
      </div>
    `;

    this.driverMarker = this.mapService.addMarker('driver', startCoords, {
      title: 'Driver',
      icon: L.divIcon({
        html: html,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
        className: 'driver-marker-container',
      }),
    });

    this.driverMarker.bindPopup('Driver Location');
  }

  /**
   * Handle driver position updates
   */
  onDriverPositionUpdate(data) {
    // Update driver marker position
    if (this.driverMarker) {
      this.mapService.updateMarkerPosition('driver', data.position);
    }

    // Update progress
    document.getElementById('trip-progress').textContent = `${Math.round(data.progress)}%`;

    // Update driver location
    document.getElementById('driver-location').textContent = `${data.position[0].toFixed(4)}, ${data.position[1].toFixed(4)}`;

    // Auto-zoom and pan to driver if in progress
    if (this.tripStatus === 'IN_PROGRESS') {
      this.mapService.panToLocation(data.position, 15);
    }

    // Check if trip is complete
    if (data.isComplete && this.tripStatus === 'IN_PROGRESS') {
      this.tripStatus = 'COMPLETED';
      this.updateTripStatus();
      this.routeTracker.stopSimulation();
      this.updateControlButtons();
      this.showSuccess('Trip completed! Driver reached destination.');
    }
  }

  /**
   * Update trip status display
   */
  updateTripStatus() {
    const statusElement = document.getElementById('trip-status');
    const statusDot = document.querySelector('.status-dot');

    const statusMap = {
      NOT_STARTED: { text: 'Not Started', class: 'inactive' },
      IN_PROGRESS: { text: 'In Progress', class: 'active' },
      PAUSED: { text: 'Paused', class: 'warning' },
      COMPLETED: { text: 'Completed', class: 'success' },
    };

    const status = statusMap[this.tripStatus];
    if (statusElement) statusElement.textContent = status.text;
    if (statusDot) {
      statusDot.className = `status-dot ${status.class}`;
    }
  }

  /**
   * Update control buttons visibility
   */
  updateControlButtons() {
    const startBtn = document.getElementById('btn-start-trip');
    const pauseBtn = document.getElementById('btn-pause-trip');
    const resumeBtn = document.getElementById('btn-resume-trip');
    const endBtn = document.getElementById('btn-end-trip');

    // Hide all
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'none';
    endBtn.style.display = 'none';

    // Show appropriate button
    if (this.tripStatus === 'NOT_STARTED') {
      startBtn.style.display = 'flex';
    } else if (this.tripStatus === 'IN_PROGRESS') {
      pauseBtn.style.display = 'flex';
      endBtn.style.display = 'flex';
    } else if (this.tripStatus === 'PAUSED') {
      resumeBtn.style.display = 'flex';
      endBtn.style.display = 'flex';
    }
  }

  /**
   * Recenter map to route
   */
  recenterMap() {
    this.mapService.fitMapToBounds();
  }

  /**
   * Show error message
   */
  showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-error';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #e74c3c;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideDown 300ms ease-out;
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #27ae60;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideDown 300ms ease-out;
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Get dashboard state
   */
  getState() {
    return {
      tripStatus: this.tripStatus,
      routeData: this.routeData,
      trackerState: this.routeTracker.getState(),
      stops: this.stops,
    };
  }

  /**
   * Destroy dashboard
   */
  destroy() {
    this.routeTracker.stopSimulation();
    this.mapService.clearAll();
    this.detailsPanel?.remove();
    this.controlsPanel?.remove();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminRouteDashboard;
}
