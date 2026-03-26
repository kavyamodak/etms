import React, { useEffect, useState } from 'react';
import { Navigation, Clock } from 'lucide-react';
import { getSocket } from '../services/socket';
import GoogleMap from './GoogleMap';

interface UserLiveMapUIProps {
  tripId: number;
  driverId?: number;
  pickupLocation: string;
  dropoffLocation: string;
  tripStatus?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  estimatedDuration?: number;
  distance?: number;
  onStatusChange?: (status: string) => void;
}

export const UserLiveMapUI: React.FC<UserLiveMapUIProps> = ({
  driverId,
  pickupLocation,
  dropoffLocation,
  tripStatus = 'scheduled',
  estimatedDuration,
  distance,
}) => {
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number; heading?: number } | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const handleLocationUpdate = (data: any) => {
      if (driverId && data.driver_id === driverId) {
        setDriverPos({
          lat: data.latitude,
          lng: data.longitude,
          heading: data.heading
        });
      }
    };

    socket.on('location:update', handleLocationUpdate);
    return () => {
      socket.off('location:update', handleLocationUpdate);
    };
  }, [driverId]);

  return (
    <div className="w-full h-full relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-inner min-h-[400px]">
      <GoogleMap
        origin={pickupLocation}
        destination={dropoffLocation}
        driverLocation={driverPos || undefined}
        className="w-full h-full"
      />

      {/* Modern Info Overlay */}
      <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-xl border border-white/20 pointer-events-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${tripStatus === 'in_progress' ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`} />
                  <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Current Status</p>
                      <p className="text-sm font-black text-gray-900 capitalize">{tripStatus.replace('_', ' ')}</p>
                  </div>
              </div>

              <div className="flex items-center gap-6 pr-2">
                  {estimatedDuration && (
                      <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
                              <Clock className="w-3.5 h-3.5" />
                              <p className="text-sm font-black">{estimatedDuration} <span className="text-[10px] lowercase">min</span></p>
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">E.T.A</p>
                      </div>
                  )}
                  {distance && (
                      <div className="flex flex-col items-end border-l border-gray-100 pl-6">
                           <div className="flex items-center gap-2 text-blue-600 mb-0.5">
                              <Navigation className="w-3.5 h-3.5" />
                              <p className="text-sm font-black">{distance} <span className="text-[10px] lowercase">km</span></p>
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Distance</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default UserLiveMapUI;

