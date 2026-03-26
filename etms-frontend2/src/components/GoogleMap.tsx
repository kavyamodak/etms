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

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: typeof origin === 'string' ? origin : origin,
        destination: typeof destination === 'string' ? destination : destination,
        waypoints: waypoints.map(wp => ({
            location: typeof wp.location === 'string' ? wp.location : wp.location,
            stopover: wp.stopover
        })),
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);
          
          // Clear previous markers
          markersRef.current.forEach((m: google.maps.Marker) => m.setMap(null));
          markersRef.current = [];

          const route = result.routes[0];
          const legs = route.legs;
          
          // Add Start Marker
          const startMarker = new google.maps.Marker({
            position: legs[0].start_location,
            map: googleMapRef.current!,
            label: { text: "P", color: "white", fontWeight: "bold" },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#10b981",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 12
            },
            title: "Pickup"
          });
          markersRef.current.push(startMarker);

          // Add waypoints markers
          for (let i = 0; i < legs.length - 1; i++) {
              const marker = new google.maps.Marker({
                  position: legs[i].end_location,
                  map: googleMapRef.current!,
                  label: { text: (i + 1).toString(), color: "white", fontWeight: "bold" },
                  icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      fillColor: "#3b82f6",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                      scale: 10
                  },
                  title: `Stop ${i + 1}`
              });
              markersRef.current.push(marker);
          }

          // Add Destination Marker
          const endMarker = new google.maps.Marker({
            position: legs[legs.length - 1].end_location,
            map: googleMapRef.current!,
            label: { text: "D", color: "white", fontWeight: "bold" },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#ef4444",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 12
            },
            title: "Destination"
          });
          markersRef.current.push(endMarker);
 
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
        }
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
