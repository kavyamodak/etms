import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface GoogleMapProps {
  origin: string | { lat: number; lng: number };
  destination: string | { lat: number; lng: number };
  waypoints?: { location: string | { lat: number; lng: number }; stopover: boolean }[];
  driverLocation?: { lat: number; lng: number; heading?: number };
  emergencyLocation?: { lat: number; lng: number };
  className?: string;
  zoom?: number;
  onRouteInfo?: (info: { distance: string; duration: string; distanceValue: number; durationValue: number }) => void;
}

// v2.x functional API configuration guard
let isSDKConfigured = false;
const configureSDK = () => {
  if (isSDKConfigured) return;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (!key) {
    console.warn("⚠️ Google Maps API key is missing or empty.");
  }
  setOptions({
    key: key,
    libraries: ["places", "marker", "routes", "geometry"]
  });
  isSDKConfigured = true;
};

export default function GoogleMap({
  origin,
  destination,
  waypoints = [],
  driverLocation,
  emergencyLocation,
  className = "w-full h-full",
  zoom = 14,
  onRouteInfo
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const emergencyMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const isValidCoordinate = (value: unknown): value is { lat: number; lng: number } => {
    if (!value || typeof value !== "object") return false;
    const candidate = value as { lat?: unknown; lng?: unknown };
    return typeof candidate.lat === "number" && Number.isFinite(candidate.lat)
      && typeof candidate.lng === "number" && Number.isFinite(candidate.lng);
  };

  const clearRouteMarkers = () => {
    markersRef.current.forEach((marker: google.maps.Marker) => marker.setMap(null));
    markersRef.current = [];
  };

  const clearRenderedRoute = () => {
    clearRouteMarkers();
    directionsRendererRef.current?.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult);
  };

  const addRouteMarker = (
    position: google.maps.LatLng | google.maps.LatLngLiteral,
    text: string,
    title: string,
    color: string,
    scale: number
  ) => {
    if (!googleMapRef.current) return;

    const marker = new google.maps.Marker({
      position,
      map: googleMapRef.current,
      label: { text, color: "white", fontWeight: "bold" },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale,
      },
      title,
    });

    markersRef.current.push(marker);
  };

  useEffect(() => {
    // Correct way to wait for SDK in v2.x
    configureSDK();
    importLibrary('maps').then(() => {
      setIsLoaded(true);
    }).catch((err: any) => {
      console.error("Critical Google Maps Load Error:", err);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 0, lng: 0 },
      zoom,
      styles: [
        {
          "featureType": "all",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
        },
        {
          "featureType": "administrative.country",
          "elementType": "geometry",
          "stylers": [{ "visibility": "on" }]
        },
        {
          "featureType": "landscape",
          "elementType": "geometry.fill",
          "stylers": [{ "color": "#f5f7fb" }]
        },
        {
          "featureType": "poi",
          "elementType": "all",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "road",
          "elementType": "geometry.fill",
          "stylers": [{ "color": "#ffffff" }]
        },
        {
          "featureType": "road",
          "elementType": "geometry.stroke",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#b1c1d1" }]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry.fill",
          "stylers": [{ "color": "#f8f9fa" }]
        },
        {
          "featureType": "water",
          "elementType": "geometry.fill",
          "stylers": [{ "color": "#dbeafe" }]
        }
      ],
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true
    });

    googleMapRef.current = map;

    // Directions Renderer
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#10b981",
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });
    directionsRendererRef.current = directionsRenderer;

    // Driver Marker (Custom icon)
    const driverMarker = new google.maps.Marker({
      map,
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: "#059669",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        rotation: 0
      },
      title: "Driver",
      zIndex: 1000
    });
    driverMarkerRef.current = driverMarker;
  }, [isLoaded]);

  // Reactive Route Rendering
  useEffect(() => {
    if (isLoaded) {
      renderRoute();
    }
  }, [isLoaded, origin, destination, waypoints]);

  const renderRoute = () => {
    if (!googleMapRef.current || !directionsRendererRef.current) return;

    if (!origin || !destination) {
      clearRenderedRoute();
      return;
    }

    const resolvedOrigin = typeof origin === 'string' ? origin : (isValidCoordinate(origin) ? origin : null);
    const resolvedDestination = typeof destination === 'string' ? destination : (isValidCoordinate(destination) ? destination : null);
    const resolvedWaypoints = waypoints
      .map((wp) => ({
        location: typeof wp.location === 'string' ? wp.location : (isValidCoordinate(wp.location) ? wp.location : null),
        stopover: wp.stopover
      }))
      .filter((wp) => wp.location);

    if (!resolvedOrigin || !resolvedDestination) {
      clearRenderedRoute();
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const geocoder = new google.maps.Geocoder();

    directionsService.route(
      {
        origin: resolvedOrigin,
        destination: resolvedDestination,
        waypoints: resolvedWaypoints as { location: string | { lat: number; lng: number }; stopover: boolean }[],
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);
          clearRouteMarkers();

          const route = result.routes[0];
          const legs = route.legs;
          
          addRouteMarker(legs[0].start_location, "P", "Pickup", "#10b981", 12);

          // Add waypoints markers
          for (let i = 0; i < legs.length - 1; i++) {
            addRouteMarker(legs[i].end_location, (i + 1).toString(), `Stop ${i + 1}`, "#3b82f6", 10);
          }

          // Add Destination Marker
          addRouteMarker(legs[legs.length - 1].end_location, "D", "Destination", "#ef4444", 12);
 
          // Calculate total distance and duration
          let totalDistance = 0;
          let totalDuration = 0;
          legs.forEach(leg => {
            totalDistance += leg.distance?.value || 0;
            totalDuration += leg.duration?.value || 0;
          });
 
          if (onRouteInfo) {
            onRouteInfo({
              distance: (totalDistance / 1000).toFixed(1) + " km",
              duration: Math.ceil(totalDuration / 60) + " min",
              distanceValue: totalDistance,
              durationValue: totalDuration
            });
          }
          return;
        }

        console.warn("Directions rendering failed, using marker fallback:", status);
        clearRenderedRoute();

        const stops = [
          { location: origin, text: "P", title: "Pickup", color: "#10b981", scale: 12 },
          ...waypoints.map((wp, index) => ({
            location: wp.location,
            text: String(index + 1),
            title: `Stop ${index + 1}`,
            color: "#3b82f6",
            scale: 10,
          })),
          { location: destination, text: "D", title: "Destination", color: "#ef4444", scale: 12 },
        ];

        const bounds = new google.maps.LatLngBounds();
        let pending = stops.length;

        const onResolved = () => {
          pending -= 1;
          if (pending === 0 && !bounds.isEmpty()) {
            googleMapRef.current?.fitBounds(bounds, 48);
          }
        };

        const resolveStop = (
          stop: { location: string | { lat: number; lng: number }; text: string; title: string; color: string; scale: number }
        ) => {
          if (typeof stop.location !== "string") {
            addRouteMarker(stop.location, stop.text, stop.title, stop.color, stop.scale);
            bounds.extend(stop.location);
            onResolved();
            return;
          }

          geocoder.geocode({ address: stop.location }, (results, geocodeStatus) => {
            if (geocodeStatus === "OK" && results?.[0]?.geometry?.location) {
              const position = results[0].geometry.location;
              addRouteMarker(position, stop.text, stop.title, stop.color, stop.scale);
              bounds.extend(position);
            } else {
              console.warn(`Fallback geocoding failed for ${stop.title}:`, geocodeStatus);
            }
            onResolved();
          });
        };

        stops.forEach(resolveStop);
      }
    );
  };

  useEffect(() => {
    if (!googleMapRef.current || !driverMarkerRef.current || !driverLocation) return;

    const { lat, lng, heading } = driverLocation;
    const position = new google.maps.LatLng(lat, lng);

    // Smooth transition (linear interpolation if needed, but simple setPosition works for 3-5s pings)
    driverMarkerRef.current.setPosition(position);
    
    if (heading != null) {
        const icon = driverMarkerRef.current.getIcon() as google.maps.Symbol;
        if (icon) {
            icon.rotation = heading;
            driverMarkerRef.current.setIcon(icon);
        }
    }

    // Optionally auto-center or auto-zoom
    // googleMapRef.current.panTo(position);
  }, [driverLocation]);

  // Reactive Emergency Marker
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current) return;

    if (!emergencyLocation) {
        if (emergencyMarkerRef.current) {
            emergencyMarkerRef.current.setMap(null);
            emergencyMarkerRef.current = null;
        }
        return;
    }

    const position = new google.maps.LatLng(emergencyLocation.lat, emergencyLocation.lng);

    if (!emergencyMarkerRef.current) {
      emergencyMarkerRef.current = new google.maps.Marker({
        map: googleMapRef.current,
        zIndex: 9999,
        title: "EMERGENCY SOS",
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 10,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 4,
          rotation: 0
        }
      });
    }

    emergencyMarkerRef.current.setPosition(position);
    googleMapRef.current.panTo(position);
    googleMapRef.current.setZoom(18);
  }, [isLoaded, emergencyLocation]);

  return (
    <div className={className} style={{ minHeight: '300px' }}>
      {!isLoaded && (
        <div className="flex items-center justify-center w-full h-full bg-gray-50 animate-pulse">
          <p className="text-gray-400 font-bold uppercase tracking-widest">Initialising Radar...</p>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
