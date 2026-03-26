import React, { useState, useEffect } from 'react';
import GoogleMap from './GoogleMap';
import { getSocket } from '../services/socket';

interface DriverMapUIProps {
  stops: Array<{
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    passengerName?: string;
  }>;
  apiKey?: string;
  onReady?: (dashboard: any) => void;
}

/**
 * Modern Google Maps based Driver Navigation UI
 */
export const DriverRouteMapUI: React.FC<DriverMapUIProps> = ({
  stops,
}) => {
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number; heading?: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverPos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading || undefined
          });
        },
        (err) => console.error("Driver tracking error:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  if (!stops || stops.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-emerald-500 font-mono text-xs tracking-widest uppercase animate-pulse">
        Establishing Satellite Link...
      </div>
    );
  }

  const origin = stops[0].address;
  const destination = stops[stops.length - 1].address;
  const waypoints = stops.slice(1, -1).map(s => ({
    location: s.address,
    stopover: true
  }));

  return (
    <div className="w-full h-full relative bg-gray-950 overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
      <GoogleMap
        origin={origin}
        destination={destination}
        waypoints={waypoints}
        driverLocation={driverPos || undefined}
        className="w-full h-full"
      />
      
      {/* HUD Overlay for Driver */}
      <div className="absolute top-6 left-6 right-6 flex items-start justify-between pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/10 pointer-events-auto max-w-[240px]">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Active Mission</p>
              </div>
              <p className="text-white font-black text-lg leading-tight mb-1">{stops[0].name}</p>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider truncate">{stops[0].address}</p>
          </div>

          <div className="bg-emerald-500 p-5 rounded-3xl shadow-2xl shadow-emerald-500/20 pointer-events-auto">
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-1">Target</p>
              <p className="text-white font-black text-lg">{stops.length} Stops</p>
          </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl px-6 py-4 rounded-[2rem] shadow-2xl border border-white/10 pointer-events-auto flex items-center gap-4">
               <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-black text-xs">GO</span>
               </div>
               <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Next Objective</p>
                    <p className="text-white font-black text-sm">{stops[1]?.name || 'Base'}</p>
               </div>
          </div>
      </div>
    </div>
  );
};

export default DriverRouteMapUI;
