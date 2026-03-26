/**
 * Driver Route Dashboard
 * Navigation-focused route management for drivers
 */

class DriverRouteDashboard {
  constructor(options = {}) {
    this.mapService = null;
    this.routeService = null;
    this.routeTracker = null;
    this.routeData = null;
    this.tripStatus = 'NOT_STARTED'; // NOT_STARTED, IN_PROGRESS, COMPLETED
    this.driverMarker = null;
    this.stops = [];
    this.completedStops = [];
    this.currentStopIndex = 0;
    this.otpModal = null;
    this.options = {
      containerId: 'map',
      autoZoom: true,
      zoomLevel: 16,
      ...options,
    };
  }

  /**
   * Initialize the driver dashboard
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
      zoom: this.options.zoomLevel,
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

      // Draw stops
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
    this.mapService.addGeoJsonRoute('driver-route', this.routeData.geojson, {
      color: '#3498db',
      weight: 6,
      opacity: 0.85,
    });
  }

  /**
   * Draw stop markers
   */
  drawStops() {
    this.stops.forEach((stop, index) => {
      const coords = [stop.lat || stop.latitude, stop.lng || stop.longitude];
      const isNextStop = index === this.currentStopIndex;
      const isCompleted = this.completedStops.includes(index);

      // Determine color
      let color = '#e74c3c'; // Pending - red
      if (isCompleted) color = '#27ae60'; // Completed - green
      if (isNextStop && !isCompleted) color = '#f39c12'; // Next - orange

      const html = `
        <div class="stop-marker-driver" style="
          background-color: ${color};
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          ${isNextStop ? 'animation: pulse-marker 1.5s infinite;' : ''}
        ">
          ${index + 1}
        </div>
      `;

      const marker = this.mapService.addMarker(`stop-${index}`, coords, {
        title: stop.name || `Stop ${index + 1}`,
        icon: L.divIcon({
          html: html,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
          className: 'driver-stop-marker',
        }),
      });

      // Add popup
      const status = isCompleted ? 'Completed' : isNextStop ? 'Next' : 'Pending';
      const popupContent = `
        <div style="padding: 8px;">
          <h4>${stop.name || `Stop ${index + 1}`}</h4>
          <p><strong>Status:</strong> ${status}</p>
          <p>${stop.address || 'No address'}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
    });
  }

  /**
   * Setup UI elements
   */
  setupUI() {
    this.createNavigationPanel();
    this.createActionPanel();
    this.createOtpModal();
    this.addCssAnimations();
  }

  /**
   * Create navigation info panel
   */
  createNavigationPanel() {
    const panel = document.createElement('div');
    panel.className = 'floating-panel navigation-panel top-left';
    panel.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Navigation</h3>
        </div>
        <div class="card-body" style="gap: var(--spacing-lg);">
          <div>
            <h4 style="margin-bottom: var(--spacing-sm);">Next Stop</h4>
            <div class="next-stop-info">
              <div class="stop-badge" style="
                background-color: #f39c12;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                margin-bottom: 8px;
                display: inline-block;
              ">
                Stop <span id="current-stop-num">1</span> of <span id="total-stops-num">${this.stops.length}</span>
              </div>
              <p style="font-weight: 600; font-size: 16px; margin-bottom: 4px;" id="next-stop-name">
                ${this.stops[0].name || 'Stop 1'}
              </p>
              <p style="font-size: 14px; color: #7f8c8d;" id="next-stop-address">
                ${this.stops[0].address || 'Loading address...'}
              </p>
            </div>
          </div>

          <div style="border-top: 1px solid #ecf0f1; padding-top: var(--spacing-md);">
            <div class="info-row">
              <span class="info-label">Distance to Next Stop</span>
              <span class="info-value" id="distance-next-stop">Calculating...</span>
            </div>
            <div class="info-row">
              <span class="info-label">ETA to Next Stop</span>
              <span class="info-value" id="eta-next-stop">--:-- min</span>
            </div>
            <div class="info-row">
              <span class="info-label">Remaining Stops</span>
              <span class="info-value" id="remaining-stops">${this.stops.length - 1}</span>
            </div>
          </div>

          <div style="border-top: 1px solid #ecf0f1; padding-top: var(--spacing-md);">
            <div class="info-row">
              <span class="info-label">Trip Progress</span>
              <span class="info-value" id="driver-trip-progress">0%</span>
            </div>
            <div style="margin-top: 8px; background-color: #f0f0f0; border-radius: 4px; height: 6px; overflow: hidden;">
              <div id="progress-bar" style="
                background-color: #3498db;
                height: 100%;
                width: 0%;
                transition: width 300ms ease-out;
              "></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.navigationPanel = panel;
  }

  /**
   * Create action panel
   */
  createActionPanel() {
    const panel = document.createElement('div');
    panel.className = 'floating-panel action-panel bottom-left';
    panel.innerHTML = `
      <div class="card">
        <div class="card-body" style="gap: var(--spacing-md);">
          <button class="btn btn-success btn-lg" id="btn-start-navigation" style="width: 100%;">
            <span>▶</span> Start Navigation
          </button>
          <button class="btn btn-primary btn-lg" id="btn-confirm-stop" style="width: 100%; display: none;">
            <span>✓</span> Confirm Stop
          </button>
          <button class="btn btn-secondary btn-lg" id="btn-recenter-driver" style="width: 100%;">
            <span>📍</span> Recenter Map
          </button>
          <button class="btn btn-danger btn-lg" id="btn-end-navigation" style="width: 100%; display: none;">
            <span>⏹</span> End Trip
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.actionPanel = panel;
  }

  /**
   * Create OTP verification modal
   */
  createOtpModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'otp-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Verify Stop</h3>
          <button class="modal-close" type="button">&times;</button>
        </div>
        <div class="modal-body">
          <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin-bottom: 8px;"><strong>Stop Name:</strong> <span id="modal-stop-name">Stop 1</span></p>
            <p style="margin-bottom: 8px;"><strong>Address:</strong> <span id="modal-stop-address">Address</span></p>
            <p><strong>Passenger:</strong> <span id="modal-passenger-name">Passenger Name</span></p>
          </div>

          <div class="input-group">
            <label class="input-label">Enter OTP for Pickup Confirmation:</label>
            <input type="text" id="otp-input" placeholder="Enter OTP (4 digits)" maxlength="4" pattern="[0-9]" style="
              font-size: 20px;
              text-align: center;
              letter-spacing: 8px;
              padding: 16px;
            ">
            <p style="font-size: 12px; color: #7f8c8d; margin-top: 8px;">
              OTP: <span id="otp-display" style="font-weight: bold; background-color: #ecf0f1; padding: 4px 8px; border-radius: 4px;">1234</span>
            </p>
          </div>

          <div style="margin-top: 16px; padding: 12px; background-color: #e8f5e9; border-radius: 6px; border-left: 4px solid #27ae60;">
            <p style="font-size: 14px; color: #27ae60;">
              <strong>ℹ️ Passenger Boarding</strong><br>
              Confirm when passenger boards the vehicle.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel-otp">Cancel</button>
          <button class="btn btn-success" id="btn-confirm-otp">Confirm Pickup</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.otpModal = modal;
  }

  /**
   * Add custom CSS animations
   */
  addCssAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-marker {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.9;
        }
      }

      @keyframes slideDown {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .driver-stop-marker {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      }

      .notification {
        animation: slideDown 300ms ease-out;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.getElementById('btn-start-navigation')?.addEventListener('click', () => this.startNavigation());
    document.getElementById('btn-confirm-stop')?.addEventListener('click', () => this.confirmStop());
    document.getElementById('btn-recenter-driver')?.addEventListener('click', () => this.recenterMap());
    document.getElementById('btn-end-navigation')?.addEventListener('click', () => this.endNavigation());

    // OTP Modal
    document.getElementById('btn-confirm-otp')?.addEventListener('click', () => this.submitOtp());
    document.getElementById('btn-cancel-otp')?.addEventListener('click', () => this.closeOtpModal());
    document.querySelector('.modal-close')?.addEventListener('click', () => this.closeOtpModal());

    // OTP input auto-focus
    document.getElementById('otp-input')?.addEventListener('focus', (e) => e.target.select());

    // Subscribe to tracker updates
    this.routeTracker.updateCallback = (data) => this.onDriverPositionUpdate(data);
  }

  /**
   * Start navigation
   */
  startNavigation() {
    if (this.tripStatus !== 'NOT_STARTED') return;

    this.tripStatus = 'IN_PROGRESS';
    this.currentStopIndex = 0;

    // Add driver marker
    this.addDriverMarker();

    // Start tracking
    this.routeTracker.startSimulation(2000);

    // Update UI
    document.getElementById('btn-start-navigation').style.display = 'none';
    document.getElementById('btn-confirm-stop').style.display = 'flex';
    document.getElementById('btn-end-navigation').style.display = 'flex';

    this.showSuccess('Navigation started. Follow the route.');
    console.log('Navigation started');
  }

  /**
   * Add driver marker
   */
  addDriverMarker() {
    const startCoords = this.routeData.coordinates[0];

    const html = `
      <div style="
        width: 44px;
        height: 44px;
        background-color: #3498db;
        border-radius: 50%;
        border: 4px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
      ">
        🚗
      </div>
    `;

    this.driverMarker = this.mapService.addMarker('driver-location', startCoords, {
      title: 'Your Location',
      icon: L.divIcon({
        html: html,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
        className: 'driver-location-marker',
      }),
    });

    this.driverMarker.bindPopup('Your current location');
  }

  /**
   * Handle driver position update
   */
  onDriverPositionUpdate(data) {
    // Update marker
    if (this.driverMarker) {
      this.mapService.updateMarkerPosition('driver-location', data.position);
    }

    // Auto-pan to driver
    if (this.tripStatus === 'IN_PROGRESS') {
      this.mapService.panToLocation(data.position, this.options.zoomLevel);
    }

    // Update progress
    document.getElementById('driver-trip-progress').textContent = `${Math.round(data.progress)}%`;
    document.getElementById('progress-bar').style.width = `${data.progress}%`;

    // Check distance to next stop
    if (this.currentStopIndex < this.stops.length) {
      const nextStop = this.stops[this.currentStopIndex];
      const nextStopCoords = [nextStop.lat || nextStop.latitude, nextStop.lng || nextStop.longitude];
      const distance = this.routeTracker.getDistanceToNextStop(nextStopCoords);

      // Update distance display
      document.getElementById('distance-next-stop').textContent = `${distance.toFixed(2)} km`;

      // Calculate ETA
      const eta = Math.round((distance / (this.routeTracker.speed / 60)) * 60);
      document.getElementById('eta-next-stop').textContent = `${eta} min`;

      // Check if near stop (within 100 meters)
      if (this.routeTracker.isNearStop(nextStopCoords, 100)) {
        this.openOtpModal(this.currentStopIndex);
      }
    }

    // Check if trip complete
    if (data.isComplete && this.tripStatus === 'IN_PROGRESS') {
      this.completeTrip();
    }
  }

  /**
   * Open OTP verification modal
   */
  openOtpModal(stopIndex) {
    if (this.otpVisible) return; // Prevent multiple modals

    this.otpVisible = true;
    const stop = this.stops[stopIndex];
    const otp = this.generateOTP();

    // Populate modal
    document.getElementById('modal-stop-name').textContent = stop.name || `Stop ${stopIndex + 1}`;
    document.getElementById('modal-stop-address').textContent = stop.address || 'No address provided';
    document.getElementById('modal-passenger-name').textContent = stop.passengerName || 'Employee';
    document.getElementById('otp-display').textContent = otp;
    document.getElementById('otp-input').value = '';
    document.getElementById('otp-input').focus();

    // Show modal
    this.otpModal.classList.add('show');
    this.currentOtp = otp;

    // Pause tracking while modal is open
    this.routeTracker.stopSimulation();
  }

  /**
   * Close OTP modal
   */
  closeOtpModal() {
    this.otpModal.classList.remove('show');
    this.otpVisible = false;

    // Resume tracking
    if (this.tripStatus === 'IN_PROGRESS') {
      this.routeTracker.startSimulation(2000);
    }
  }

  /**
   * Submit OTP
   */
  submitOtp() {
    const inputOtp = document.getElementById('otp-input').value;

    if (inputOtp === this.currentOtp) {
      this.markStopCompleted();
      this.closeOtpModal();
      this.showSuccess(`Stop ${this.currentStopIndex + 1} completed!`);

      // Resume tracking
      if (this.tripStatus === 'IN_PROGRESS') {
        this.routeTracker.startSimulation(2000);
      }

      // Move to next stop
      this.currentStopIndex++;
      this.updateNavigationPanel();
    } else {
      this.showError('Invalid OTP. Try again.');
    }
  }

  /**
   * Confirm stop manually
   */
  confirmStop() {
    if (this.otpVisible) {
      this.submitOtp();
    }
  }

  /**
   * Mark stop as completed
   */
  markStopCompleted() {
    this.completedStops.push(this.currentStopIndex);
    this.routeTracker.markStopCompleted(this.currentStopIndex);

    // Redraw stops to update colors
    const previousMarkers = Object.keys(this.mapService.markers);
    previousMarkers.forEach((id) => {
      if (id.startsWith('stop-')) {
        this.mapService.removeMarker(id);
      }
    });

    this.drawStops();

    // Update remaining stops
    const remaining = this.stops.length - this.completedStops.length;
    document.getElementById('remaining-stops').textContent = remaining;
  }

  /**
   * Update navigation panel display
   */
  updateNavigationPanel() {
    if (this.currentStopIndex >= this.stops.length) {
      this.completeTrip();
      return;
    }

    const nextStop = this.stops[this.currentStopIndex];
    document.getElementById('current-stop-num').textContent = this.currentStopIndex + 1;
    document.getElementById('next-stop-name').textContent = nextStop.name || `Stop ${this.currentStopIndex + 1}`;
    document.getElementById('next-stop-address').textContent = nextStop.address || 'Loading address...';
  }

  /**
   * Complete trip
   */
  completeTrip() {
    this.tripStatus = 'COMPLETED';
    this.routeTracker.stopSimulation();

    // Update UI
    document.getElementById('btn-confirm-stop').style.display = 'none';
    document.getElementById('btn-end-navigation').style.display = 'none';
    document.getElementById('btn-start-navigation').style.display = 'flex';

    this.showSuccess('🎉 Trip completed! All stops visited.');
    console.log('Trip completed');
  }

  /**
   * End navigation
   */
  endNavigation() {
    this.tripStatus = 'COMPLETED';
    this.routeTracker.stopSimulation();
    this.closeOtpModal();

    // Update UI
    document.getElementById('btn-confirm-stop').style.display = 'none';
    document.getElementById('btn-end-navigation').style.display = 'none';
    document.getElementById('btn-start-navigation').style.display = 'flex';

    this.showSuccess('Trip ended.');
  }

  /**
   * Recenter map to driver
   */
  recenterMap() {
    if (this.driverMarker) {
      const driverPos = this.driverMarker.getLatLng();
      this.mapService.panToLocation([driverPos.lat, driverPos.lng], this.options.zoomLevel);
    }
  }

  /**
   * Generate OTP
   */
  generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Show error notification
   */
  showError(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #e74c3c;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      animation: slideUp 300ms ease-out;
    `;
    notification.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Show success notification
   */
  showSuccess(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #27ae60;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      animation: slideUp 300ms ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Get state
   */
  getState() {
    return {
      tripStatus: this.tripStatus,
      currentStopIndex: this.currentStopIndex,
      completedStops: this.completedStops,
      routeData: this.routeData,
      trackerState: this.routeTracker.getState(),
    };
  }

  /**
   * Destroy dashboard
   */
  destroy() {
    this.routeTracker.stopSimulation();
    this.mapService.clearAll();
    this.navigationPanel?.remove();
    this.actionPanel?.remove();
    this.otpModal?.remove();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DriverRouteDashboard;
}
