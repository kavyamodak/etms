import React from 'react';
import GoogleMap from './GoogleMap';

interface AdminMapUIProps {
  stops: Array<{
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    status?: 'pending' | 'in-progress' | 'completed';
  }>;
  apiKey?: string;
  onReady?: (dashboard: any) => void;
  tripsToDisplay?: Array<{
    employee_name: string;
    start_location: string;
    end_location: string;
    status: string;
  }>;
  emergencyLocation?: { lat: number; lng: number };
  onRouteInfo?: (info: { distance: string; duration: string; distanceValue: number; durationValue: number }) => void;
}

/**
 * Modern Google Maps based Admin Route UI
 */
export const AdminRouteMapUI: React.FC<AdminMapUIProps> = ({
  stops,
  tripsToDisplay = [],
  emergencyLocation,
  onRouteInfo
}) => {
  const toCoordinate = (stop?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  }) => {
    if (!stop) return null;
    const lat = Number(stop.lat ?? stop.latitude);
    const lng = Number(stop.lng ?? stop.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  if (!stops || stops.length < 2) {
    if (emergencyLocation) {
        return (
            <div className="w-full h-full relative bg-gray-50 overflow-hidden rounded-[2rem] border border-gray-100 shadow-inner">
                <GoogleMap
                    origin=""
                    destination=""
                    emergencyLocation={emergencyLocation}
                    className="w-full h-full"
                />
            </div>
        );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 font-medium">
        Waiting for route coordinates...
      </div>
    );
  }

  const origin = stops[0].address;
  const originLocation = toCoordinate(stops[0]) || origin;
  const destination = stops[stops.length - 1].address;
  const destinationLocation = toCoordinate(stops[stops.length - 1]) || destination;
  const waypoints = stops.slice(1, -1).map(s => ({
    location: toCoordinate(s) || s.address,
    stopover: true
  }));

  return (
    <div className="w-full h-full relative bg-gray-50 overflow-hidden rounded-[2rem] border border-gray-100 shadow-inner">
      <GoogleMap
        origin={originLocation}
        destination={destinationLocation}
        waypoints={waypoints}
        emergencyLocation={emergencyLocation}
        onRouteInfo={onRouteInfo}
        className="w-full h-full"
      />
      
      {/* Dynamic Overlay for Route Info */}
      <div className="absolute bottom-6 left-6 right-6 flex gap-4 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 pointer-events-auto">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Route Optimised</p>
              <p className="text-sm font-black text-gray-900">{stops.length} Tactical Points</p>
          </div>
          {tripsToDisplay.length > 0 && (
              <div className="bg-gray-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/10 pointer-events-auto">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Personnel</p>
                  <p className="text-sm font-black text-white">{tripsToDisplay.length} Employees</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default AdminRouteMapUI;
