import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Maximize2, AlertCircle, ExternalLink, User, Phone, MessageCircle, Flag, Search, Clock, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useEffect, useRef, useState } from 'react';
import { routesAPI, tripAPI, driverAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GoogleMap from './GoogleMap';
import { socket, connectSocket, joinTripRoom, listenForLocationUpdate, listenForTripStatus } from '../services/socket';

interface RouteData {
  id: number;
  route_name: string;
  start_location: string;
  end_location: string;
  distance: number;
  estimated_duration: number;
  status: string;
  driver_name?: string;
  driver_phone?: string;
  waypoints?: string[];
  passengers?: { name: string, pickup: string, phone?: string }[];
  trip_data?: TripData;
}

interface TripData {
  id: number;
  employee_name: string;
  driver_name?: string;
  driver_phone?: string;
  passenger_phone?: string;
  vehicle_number?: string;
  start_location: string;
  end_location: string;
  scheduled_time: string;
  status: string;
  created_at: string;
  user_id?: number;
  route_id?: number;
  passenger_name?: string;
}

export default function MapFullView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  
  const isDriver = location.pathname.includes('/driver');
  const isUser = location.pathname.includes('/user');

  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [routesData, tripsData] = await Promise.all([
        routesAPI.getAll(),
        (user?.role === 'admin' ? tripAPI.getAll() : tripAPI.getUserTrips()),
      ]);

      const activeTrips = (Array.isArray(tripsData) ? tripsData : []).filter((trip: any) => {
        const status = trip.status?.toLowerCase();
        return status === 'in_progress' || status === 'scheduled' || status === 'pending';
      });

      let processedRoutes: RouteData[] = [];
      if (user?.role === 'driver') {
        const groupedMap = new Map();
        activeTrips.forEach((trip: any) => {
          const rid = trip.route_id || `temp-${trip.id}`;
          if (!groupedMap.has(rid)) {
            groupedMap.set(rid, {
              id: rid,
              route_name: trip.route_name || `${trip.start_location} → ${trip.end_location}`,
              start_location: trip.start_location,
              end_location: trip.end_location,
              status: trip.status,
              trip_data: trip,
              passengers: [],
              vehicle_number: trip.vehicle_number,
              driver_name: user?.full_name,
              distance: trip.total_distance || 22,
              estimated_duration: Math.round((trip.total_duration || 3000) / 60) || 50,
            });
          }
          groupedMap.get(rid).passengers.push({
            name: trip.passenger_name || trip.employee_name,
            pickup: trip.start_location,
            phone: trip.passenger_phone
          });
        });
        processedRoutes = Array.from(groupedMap.values());
      } else {
        processedRoutes = (routesData as any[])
          .filter(r => r.status !== 'completed' && r.status !== 'cancelled')
          .map(r => ({
            ...r,
            distance: r.distance || 0,
            estimated_duration: r.estimated_duration || 0,
            driver_name: r.driver_name,
            trip_data: activeTrips.find((t: any) => t.route_id === r.id)
          }));
      }
      setRoutes(processedRoutes);

      // Auto-selection logic
      if (processedRoutes.length > 0) {
        const activeInProgress = processedRoutes.find(r => r.status === 'in_progress');
        if (!selectedRoute) {
          setSelectedRoute(activeInProgress || processedRoutes[0]);
        } else {
          const updated = processedRoutes.find(r => r.id === selectedRoute.id);
          if (activeInProgress && selectedRoute.status !== 'in_progress') {
             setSelectedRoute(activeInProgress);
          } else if (updated) {
             setSelectedRoute(updated);
          }
        }
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      if (!silent) setMapError(err.message || 'Failed to load route and trip data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
    if (token) connectSocket(token);
    const interval = setInterval(() => fetchData(true), 30000);
    
    const cleanupTripStatus = listenForTripStatus((data) => {
      console.log('🔄 Trip status update detected:', data);
      fetchData(true);
    });

    return () => {
      clearInterval(interval);
      cleanupTripStatus();
    };
  }, [user, token]);

  useEffect(() => {
    if (selectedRoute?.trip_data?.id) {
      joinTripRoom(selectedRoute.trip_data.id);
      return listenForLocationUpdate((data) => {
        if (data.trip_id === selectedRoute.trip_data?.id) {
          setCurrentLocation({ lat: data.latitude, lng: data.longitude });
          setLastUpdated(new Date());
        }
      });
    }
  }, [selectedRoute]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isDriver ? '/driver' : isUser ? '/user' : '/admin');
    }
  };

  return (
    <div className="p-6 bg-[#f4f7f6] min-h-screen">
      <div className="flex items-center gap-3 mb-6">
         <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl hover:bg-gray-100">
           <ArrowLeft className="w-5 h-5" />
         </Button>
         <h1 className="text-2xl font-semibold text-gray-700">Map Page</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT CARD - TRIP DETAILS */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Trip Details</h2>
          </div>

          {routes.length > 0 ? (
            <>
              {/* Driver/User */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user?.role === 'driver' ? (selectedRoute?.passengers?.[0]?.name || 'P') : (selectedRoute?.driver_name || 'R')}&background=${user?.role === 'driver' ? '3b82f6' : '10b981'}&color=fff&bold=true`}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="text-sm text-gray-500">Active Route</p>
                    <p className="font-semibold text-gray-700">
                      {user?.role === 'driver' ? user.full_name : (selectedRoute?.driver_name || 'No driver assigned')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button 
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      const phone = user?.role === 'driver' ? selectedRoute?.passengers?.[0]?.phone : selectedRoute?.driver_phone;
                      if (phone) window.location.href = `sms:${phone}`;
                    }}
                  >
                    <MessageCircle size={16} />
                  </button>
                  <button 
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      const phone = user?.role === 'driver' ? selectedRoute?.passengers?.[0]?.phone : selectedRoute?.driver_phone;
                      if (phone) window.location.href = `tel:${phone}`;
                    }}
                  >
                    <Phone size={16} />
                  </button>
                </div>
              </div>

              {/* Route List */}
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-350px)] pr-1">
                  {routes.map((route) => (
                    <div 
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      className={`border rounded-xl p-4 transition-all cursor-pointer ${
                        selectedRoute?.id === route.id ? 'border-emerald-500 bg-emerald-50/10 shadow-sm' : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <span>{route.start_location.split(',')[0]}</span>
                        <span className="text-green-600">→</span>
                        <span className="font-semibold">{route.end_location.split(',')[0]}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                        <MapPin size={14} />
                        <span>{user?.role === 'driver' ? (route.passengers?.[0]?.name || 'Passenger') : (route.driver_name || 'Driver')}</span>
                      </div>

                      {/* Metrics */}
                      <div className="flex gap-6 mt-3 text-gray-700">
                        <span>{route.distance || 0} km</span>
                        <span>{route.estimated_duration || 0} min</span>
                      </div>

                      {/* Bottom Row */}
                      <div className="flex items-center justify-between mt-4">
                        <input
                          type="text"
                          readOnly
                          value={user?.role === 'driver' ? (route.passengers?.[0]?.name || 'No passenger') : (route.driver_name || 'No driver')}
                          className="text-sm bg-gray-100 px-3 py-2 rounded-lg w-full mr-3 outline-none"
                        />

                        <div className="flex gap-2">
                          <button className="bg-green-500 text-white p-2 rounded-full">
                            <MessageCircle size={16} />
                          </button>
                          <button className="bg-gray-200 p-2 rounded-full">
                            <CheckCircle size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6">
               <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <Navigation className="w-12 h-12 text-gray-300" />
               </div>
               <h3 className="text-lg font-semibold text-gray-700 mb-1">No Active Trips</h3>
               <p className="text-gray-500 text-sm max-w-[200px]">Once a trip is assigned from the database, it will appear here instantly.</p>
            </div>
          )}
        </div>

        {/* RIGHT CARD - LIVE TRACKING */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Live Tracking</h2>
            <span className="bg-green-100 text-green-600 text-xs px-3 py-1 font-bold rounded-full animate-pulse">
              LIVE
            </span>
          </div>

          {/* Map */}
          <div className="rounded-xl overflow-hidden mb-4 flex-1 min-h-[350px] border border-gray-100">
            {selectedRoute ? (
              <GoogleMap
                origin={selectedRoute.start_location}
                destination={selectedRoute.end_location}
                waypoints={selectedRoute.waypoints?.map(wp => ({ location: wp, stopover: true })) || []}
                driverLocation={currentLocation || undefined}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 font-medium">
                Establishing secure link...
              </div>
            )}
          </div>

          {/* Bottom Info */}
          {selectedRoute && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <MapPin size={16} />
              <span>{selectedRoute.start_location.split(',')[0]}</span>
              <span className="text-green-600">→</span>
              <span className="font-semibold">{selectedRoute.end_location.split(',')[0]}</span>
            </div>

            <div className="text-sm text-gray-500 mt-1">
              {user?.role === 'driver' ? user.full_name : (selectedRoute.driver_name || 'No driver')}
            </div>

            <div className="flex justify-between items-center mt-3 text-gray-700">
              <div className="flex gap-6">
                <span>{selectedRoute.distance || 0} km</span>
                <span>{selectedRoute.estimated_duration || 0} min</span>
              </div>

              <span className="text-sm text-gray-400">
                Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* FLOATING CALL BUTTON */}
      <button 
        onClick={() => {
          const phone = user?.role === 'driver' ? selectedRoute?.passengers?.[0]?.phone : selectedRoute?.driver_phone;
          if (phone) window.location.href = `tel:${phone}`;
        }}
        className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-110 active:scale-95 z-50"
      >
        <Phone />
      </button>
    </div>
  );
}