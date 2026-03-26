/**
 * Route Tracker & Live Simulation
 * Manages driver position updates and live tracking simulation
 */

class RouteTracker {
  constructor() {
    this.currentPosition = null;
    this.routeCoordinates = [];
    this.currentIndex = 0;
    this.isSimulating = false;
    this.updateInterval = null;
    this.updateCallback = null;
    this.speed = 40; // km/h
    this.nextStopIndex = 0;
    this.completedStops = [];
  }

  /**
   * Initialize tracking with route coordinates
   * @param {array} coordinates - Array of [lat, lng] coordinates
   * @param {number} speed - Speed in km/h
   * @param {function} onUpdate - Callback function on each position update
   */
  initializeTracking(coordinates, speed = 40, onUpdate = null) {
    this.routeCoordinates = coordinates;
    this.currentIndex = 0;
    this.currentPosition = coordinates[0];
    this.speed = speed;
    this.updateCallback = onUpdate;
    this.nextStopIndex = 1;
  }

  /**
   * Start live position simulation
   * @param {number} updateIntervalMs - Update frequency in milliseconds
   */
  startSimulation(updateIntervalMs = 3000) {
    if (this.isSimulating || this.routeCoordinates.length === 0) {
      return;
    }

    this.isSimulating = true;
    this.updateInterval = setInterval(() => {
      this.updatePosition();
    }, updateIntervalMs);
  }

  /**
   * Stop simulation
   */
  stopSimulation() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isSimulating = false;
  }

  /**
   * Update driver position along route
   */
  updatePosition() {
    if (this.currentIndex < this.routeCoordinates.length - 1) {
      this.currentIndex++;
      this.currentPosition = this.routeCoordinates[this.currentIndex];

      if (this.updateCallback) {
        this.updateCallback({
          position: this.currentPosition,
          index: this.currentIndex,
          progress: (this.currentIndex / (this.routeCoordinates.length - 1)) * 100,
          isComplete: this.currentIndex === this.routeCoordinates.length - 1,
        });
      }
    } else {
      this.stopSimulation();
    }
  }

  /**
   * Manually set driver position
   * @param {array} coordinates - [lat, lng]
   */
  setPosition(coordinates) {
    this.currentPosition = coordinates;
    if (this.updateCallback) {
      this.updateCallback({
        position: coordinates,
        index: this.currentIndex,
        progress: (this.currentIndex / (this.routeCoordinates.length - 1)) * 100,
      });
    }
  }

  /**
   * Get current position
   * @returns {array} - [lat, lng]
   */
  getCurrentPosition() {
    return this.currentPosition;
  }

  /**
   * Get progress percentage
   * @returns {number} - Progress 0-100
   */
  getProgress() {
    if (this.routeCoordinates.length === 0) return 0;
    return (this.currentIndex / (this.routeCoordinates.length - 1)) * 100;
  }

  /**
   * Get distance to next stop
   * @param {array} nextStopCoords - [lat, lng]
   * @returns {number} - Distance in km
   */
  getDistanceToNextStop(nextStopCoords) {
    if (!this.currentPosition) return 0;
    return this.calculateDistance(this.currentPosition, nextStopCoords);
  }

  /**
   * Calculate Haversine distance between two points
   * @param {array} coord1 - [lat, lng]
   * @param {array} coord2 - [lat, lng]
   * @returns {number} - Distance in km
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2[0] - coord1[0]);
    const dLon = this.toRad(coord2[1] - coord1[1]);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1[0])) *
        Math.cos(this.toRad(coord2[0])) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  toRad(deg) {
    return (deg * Math.PI) / 180;
  }

  /**
   * Check if driver is near a stop (within threshold distance)
   * @param {array} stopCoords - [lat, lng]
   * @param {number} thresholdMeters - Detection radius in meters
   * @returns {boolean} - Is driver near stop
   */
  isNearStop(stopCoords, thresholdMeters = 100) {
    const distance = this.getDistanceToNextStop(stopCoords);
    return distance * 1000 <= thresholdMeters; // Convert km to meters
  }

  /**
   * Calculate ETA to destination
   * @param {array} destinationCoords - [lat, lng]
   * @returns {number} - ETA in minutes
   */
  calculateETAToDestination(destinationCoords) {
    const distanceKm = this.getDistanceToNextStop(destinationCoords);
    return Math.round((distanceKm / this.speed) * 60);
  }

  /**
   * Mark stop as completed
   * @param {number} stopIndex - Stop index
   */
  markStopCompleted(stopIndex) {
    if (!this.completedStops.includes(stopIndex)) {
      this.completedStops.push(stopIndex);
    }
  }

  /**
   * Get next stop index
   * @param {array} stops - Array of stop coordinates
   * @returns {number} - Index of next stop
   */
  getNextStopIndex(stops) {
    for (let i = 0; i < stops.length; i++) {
      if (!this.completedStops.includes(i)) {
        return i;
      }
    }
    return stops.length - 1;
  }

  /**
   * Get completion stats
   * @param {array} stops - Array of stops
   * @returns {object} - Completion stats
   */
  getCompletionStats(stops) {
    return {
      completedStops: this.completedStops.length,
      totalStops: stops.length,
      percentageComplete: (this.completedStops.length / stops.length) * 100,
      remainingStops: stops.length - this.completedStops.length,
    };
  }

  /**
   * Reset tracker
   */
  reset() {
    this.stopSimulation();
    this.currentPosition = null;
    this.currentIndex = 0;
    this.routeCoordinates = [];
    this.completedStops = [];
  }

  /**
   * Get state
   */
  getState() {
    return {
      isSimulating: this.isSimulating,
      currentPosition: this.currentPosition,
      currentIndex: this.currentIndex,
      progress: this.getProgress(),
      speed: this.speed,
      completedStops: this.completedStops,
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RouteTracker;
}
