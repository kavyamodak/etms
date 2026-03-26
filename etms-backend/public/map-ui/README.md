# 🗺️ ETMS Route Management Map UI

A production-ready, Google Maps-like route management system built with **Leaflet + OpenRouteService**. Supports real-time tracking, OTP verification, and live route visualization for both Admin and Driver dashboards.

---

## 📋 Features

### ✨ Admin Dashboard
- ✅ Complete route visualization with start/end points
- ✅ Multiple stop markers with custom icons (numbered)
- ✅ Real-time driver tracking simulation
- ✅ Route details panel (distance, ETA, stops count)
- ✅ Trip controls: Start, Pause, Resume, End
- ✅ Live progress tracking with percentage
- ✅ Automatic map recentering
- ✅ Status badges (Not Started, In Progress, Paused, Completed)

### 🚗 Driver Dashboard
- ✅ Navigation-optimized UI
- ✅ Current driver location marker (animated)
- ✅ Next stop highlighting (with pulsing animation)
- ✅ Distance & ETA to next stop (auto-updating)
- ✅ OTP verification modal for stop confirmation
- ✅ Remaining stops counter
- ✅ Trip progress bar
- ✅ Auto-pan to driver location during navigation
- ✅ Completed stops tracking

### 🎨 Modern UI/UX
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Floating info panels
- ✅ Color-coded stops (Red=Pending, Orange=Current, Green=Completed)
- ✅ Smooth animations and transitions
- ✅ Leaflet integration with OpenStreetMap tiles
- ✅ No external dependencies (except Leaflet)

---

## 🚀 Quick Start

### 1. **Include Files in Your HTML**

```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Main Styles -->
<link rel="stylesheet" href="path/to/css/main.css" />

<!-- Your map container -->
<div id="map"></div>

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Services -->
<script src="path/to/js/leaflet-service.js"></script>
<script src="path/to/js/openroute-service.js"></script>
<script src="path/to/js/route-tracker.js"></script>

<!-- Dashboards -->
<script src="path/to/admin/admin-dashboard.js"></script>
<script src="path/to/driver/driver-dashboard.js"></script>
```

### 2. **Initialize Admin Dashboard**

```javascript
// Sample stops data
const stops = [
  { name: 'Office', latitude: 28.6139, longitude: 77.209 },
  { name: 'Stop 1', latitude: 28.5921, longitude: 77.0479 },
  { name: 'Stop 2', latitude: 28.5921, longitude: 77.097 },
];

// Create dashboard
const dashboard = new AdminRouteDashboard({
  containerId: 'map',
  autoZoom: true,
});

// Initialize with stops
await dashboard.initialize(stops);
```

### 3. **Initialize Driver Dashboard**

```javascript
const driverDashboard = new DriverRouteDashboard({
  containerId: 'map',
  autoZoom: true,
  zoomLevel: 16,
});

await driverDashboard.initialize(stops);
```

---

## 📁 Project Structure

```
map-ui/
├── css/
│   └── main.css                    # Global styles
├── js/
│   ├── leaflet-service.js         # Leaflet map utilities
│   ├── openroute-service.js       # OpenRouteService API integration
│   └── route-tracker.js            # Live tracking simulation
├── admin/
│   └── admin-dashboard.js          # Admin dashboard component
├── driver/
│   └── driver-dashboard.js         # Driver dashboard component
└── index.html                       # Demo page
```

---

## 🔧 API Reference

### LeafletMapService

```javascript
const mapService = new LeafletMapService();

// Initialize map
mapService.initializeMap('containerId', {
  center: [28.6139, 77.209],
  zoom: 13,
});

// Add marker
mapService.addMarker('marker-id', [lat, lng], {
  title: 'Marker Title',
  icon: L.icon({ ... }),
});

// Add polyline route
mapService.addPolyline('route-id', coordinates, {
  color: '#3498db',
  weight: 4,
  opacity: 0.8,
});

// Add GeoJSON route
mapService.addGeoJsonRoute('route-id', geojson, {
  color: '#3498db',
  weight: 5,
});

// Update marker position
mapService.updateMarkerPosition('marker-id', [newLat, newLng]);

// Pan to location
mapService.panToLocation([lat, lng], zoomLevel);

// Fit bounds
mapService.fitMapToBounds(padding);
```

### OpenRouteServiceClient

```javascript
const routeService = new OpenRouteServiceClient(apiKey);

// Get route between waypoints
const route = await routeService.getRoute([
  [77.2090, 28.6139], // lng, lat (ORS format)
  [77.0479, 28.5921],
]);

// Get Leaflet-formatted route
const leafletRoute = await routeService.getLeafletRoute(waypoints);
// Returns: { coordinates, distance, duration, distanceKm, durationMinutes }

// Calculate distance between points
const distance = routeService.calculateDistance(
  [lat1, lng1],
  [lat2, lng2]
); // Returns: distance in km

// Calculate ETA
const etaMinutes = routeService.calculateETA(distanceKm, speedKmh);
```

### RouteTracker

```javascript
const tracker = new RouteTracker();

// Initialize tracking
tracker.initializeTracking(coordinates, speed, onUpdateCallback);

// Start simulation
tracker.startSimulation(updateIntervalMs);

// Stop simulation
tracker.stopSimulation();

// Get current position
const position = tracker.getCurrentPosition();

// Get progress percentage
const progress = tracker.getProgress();

// Check if near stop
const isNear = tracker.isNearStop(stopCoords, thresholdMeters);

// Mark stop as completed
tracker.markStopCompleted(stopIndex);
```

### AdminRouteDashboard

```javascript
const admin = new AdminRouteDashboard(options);

// Initialize
await admin.initialize(stops, apiKey);

// Start trip
admin.startTrip();

// Pause trip
admin.pauseTrip();

// Resume trip
admin.resumeTrip();

// End trip
admin.endTrip();

// Get state
const state = admin.getState();

// Cleanup
admin.destroy();
```

### DriverRouteDashboard

```javascript
const driver = new DriverRouteDashboard(options);

// Initialize
await driver.initialize(stops, apiKey);

// Start navigation
driver.startNavigation();

// Confirm stop (triggers OTP modal)
driver.confirmStop();

// Get state
const state = driver.getState();

// Cleanup
driver.destroy();
```

---

## 🔌 Integration with Backend

### Backend API Endpoints (Django/FastAPI)

```python
# GET /api/trips/<trip_id>
{
  "id": "trip-123",
  "status": "in_progress",
  "stops": [
    {
      "id": "stop-1",
      "name": "Office",
      "latitude": 28.6139,
      "longitude": 77.209,
      "address": "...",
      "status": "completed"
    },
    ...
  ],
  "driver": {
    "id": "driver-1",
    "name": "John Doe",
    "latitude": 28.5951,
    "longitude": 77.1234,
    "status": "active"
  },
  "route": {
    "distance_km": 45.2,
    "duration_minutes": 120,
    "polyline": "geojson..."
  }
}

# POST /api/trips/<trip_id>/start
# PUT /api/trips/<trip_id>/pause
# PUT /api/trips/<trip_id>/resume
# PUT /api/trips/<trip_id>/end

# POST /api/stops/<stop_id>/verify-otp
{
  "otp": "1234",
  "driver_id": "driver-1"
}
```

### Frontend-Backend Integration

```javascript
// Fetch trip data from backend
async function fetchTripData(tripId) {
  const response = await fetch(`/api/trips/${tripId}`);
  const tripData = await response.json();

  // Initialize dashboard with data
  const dashboard = new AdminRouteDashboard();
  await dashboard.initialize(tripData.stops);

  return dashboard;
}

// Send trip status updates
async function updateTripStatus(tripId, action) {
  const response = await fetch(`/api/trips/${tripId}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp: new Date() }),
  });

  return response.json();
}

// Submit OTP verification
async function submitOtpVerification(stopId, otp, driverId) {
  const response = await fetch(`/api/stops/${stopId}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp, driver_id: driverId }),
  });

  return response.json();
}
```

---

## 📊 Data Format

### Stops Format

```javascript
{
  name: "Stop Name",
  address: "123 Main Street",
  latitude: 28.5921,
  longitude: 77.0479,
  passengerName: "Employee Name",  // For driver dashboard
  status: "pending",                // pending, in-progress, completed
}
```

### Coordinate Format

- **ORS Format**: `[longitude, latitude]`
- **Leaflet Format**: `[latitude, longitude]`

The services automatically handle conversion between these formats.

---

## ⚙️ Configuration

### OpenRouteService API Key

Get free tier key from: https://openrouteservice.org/

```javascript
const routeService = new OpenRouteServiceClient('your-api-key');
```

Free tier limits: 40,000 requests/day (sufficient for most use cases)

### Map Options

```javascript
const dashboard = new AdminRouteDashboard({
  containerId: 'map',           // HTML element ID
  panelPosition: 'bottom-right', // or 'top-left', 'top-right', 'bottom-left'
  autoZoom: true,               // Auto-fit map to route
});
```

### Driver Dashboard Options

```javascript
const driver = new DriverRouteDashboard({
  containerId: 'map',
  autoZoom: true,
  zoomLevel: 16,  // Default zoom when panning to driver
});
```

---

## 🎨 Customization

### Change Route Color

```javascript
// In Admin/Driver dashboard initialization
mapService.addGeoJsonRoute('route-id', geojson, {
  color: '#e74c3c',  // Change to desired color
  weight: 5,
  opacity: 0.8,
});
```

### Custom Stop Icons

```javascript
// Override createStopIcon in admin dashboard
AdminRouteDashboard.prototype.createStopIcon = function(index, status) {
  // Return custom L.divIcon
  return L.divIcon({
    html: `<div>Custom Icon</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};
```

### Custom Markers

```javascript
const customIcon = L.icon({
  iconUrl: 'custom-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

mapService.addMarker('id', [lat, lng], { icon: customIcon });
```

---

## 📱 Responsive Design

The UI automatically adapts to:
- **Desktop** (1280px+) - Full-featured layout
- **Tablet** (768px - 1279px) - Compressed panels
- **Mobile** (< 768px) - Stacked panels, touch-optimized buttons

---

## 🔒 Security Considerations

1. **OTP Generation**: Currently generates random 4-digit OTP. In production:
   ```javascript
   // Backend generates and sends OTP
   // Frontend receives and displays
   submitOtp(otp) {
     return fetch('/api/verify-otp', {
       method: 'POST',
       body: JSON.stringify({ otp, stop_id, trip_id })
     });
   }
   ```

2. **API Key Protection**: Store in backend, not frontend
3. **HTTPS Only**: Always use HTTPS in production
4. **Rate Limiting**: Implement backend rate limiting for OTP attempts

---

## 🚀 Performance Tips

1. **Cache Routes**: Routes are cached after first fetch
   ```javascript
   routeService.getCacheSize();      // Check cache
   routeService.clearCache();         // Clear if needed
   ```

2. **Optimize Update Intervals**:
   ```javascript
   tracker.startSimulation(3000);  // Update every 3 seconds
   ```

3. **Lazy Load Maps**: Initialize only when visible
4. **Marker Clustering**: For many stops (100+), use marker clustering

Example with marker clustering:
```javascript
// Add to HTML: <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
// <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
```

---

## 🐛 Troubleshooting

### Map not displaying
- Check if container `<div id="map">` exists
- Verify CSS is loaded (especially Leaflet CSS)
- Check browser console for errors

### Route not showing
- Verify waypoints are in `[lng, lat]` format for ORS
- Check API key is valid
- Check internet connection for ORS API calls

### Markers not updating
- Verify marker ID exists
- Check `updateMarkerPosition()` is called with valid coordinates
- Ensure tracker is running with `startSimulation()`

### OTP Modal not appearing
- Check driver is within 100m of stop
- Verify `driver.tripStatus === 'IN_PROGRESS'`
- Check browser console for JavaScript errors

---

## 📝 Examples

### Example 1: Full Admin Flow

```javascript
// Initialize
const dashboard = new AdminRouteDashboard();
await dashboard.initialize(stops);

// Start trip (button click)
dashboard.startTrip();

// Monitor state
setInterval(() => {
  const state = dashboard.getState();
  console.log('Trip Status:', state.tripStatus);
  console.log('Progress:', state.trackerState.progress);
}, 1000);

// End trip
dashboard.endTrip();
```

### Example 2: Full Driver Flow

```javascript
// Initialize
const driver = new DriverRouteDashboard();
await driver.initialize(stops);

// Start navigation
driver.startNavigation();

// OTP automatically shows when near stop
// User confirms pickup via modal
```

### Example 3: Real-time Updates from Server

```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://your-server/trips/123/stream');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Update driver position
  if (data.type === 'driver_position') {
    dashboard.routeTracker.setPosition([
      data.latitude,
      data.longitude,
    ]);
  }

  // Update stop status
  if (data.type === 'stop_completed') {
    dashboard.stops[data.stopIndex].status = 'completed';
    dashboard.drawStops();
  }
};
```

---

## 📚 Dependencies

### Required
- **Leaflet** 1.9.4+ - Map visualization
- **OpenRouteService API** - Route generation

### Optional
- **Leaflet MarkerCluster** - For clustering many markers
- **Leaflet Draw** - For custom route drawing

---

## 💡 Future Enhancements

- [ ] Turn-by-turn directions panel
- [ ] Traffic visualization
- [ ] Offline map support
- [ ] Multiple route alternatives
- [ ] Real-time GPS tracking (WebSocket)
- [ ] Voice navigation
- [ ] Dark/Light theme toggle
- [ ] Route optimization algorithm

---

## 📄 License

MIT License - Free for commercial and personal use

---

## 🤝 Support

For issues and feature requests, create an issue in the repository or contact the development team.

---

**Built with ❤️ for ETMS** | Last Updated: March 2026
