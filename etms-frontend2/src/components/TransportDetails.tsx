import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, User, Car, Phone, Lock, Navigation } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { tripAPI, routesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import GoogleMap from './GoogleMap';
import { getSocket } from '../services/socket';

// Haversine formula to calculate distance between two coordinates in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface DetailedTrip {
  id: number;
  employee_name: string;
  employee_phone?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_number?: string;
  start_location: string;
  end_location: string;
  scheduled_time: string;
  status: string;
  route_id?: number;
  sequence_number?: number;
  cost?: number;
  created_at: string;
}

interface Stop {
  id: number;
  employee_name: string;
  sequence_number: number;
  status: string;
  location: string;
}

export default function TransportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const notify = useNotify();
  const [trip, setTrip] = useState<DetailedTrip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number; heading?: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [autoCompleteTriggered, setAutoCompleteTriggered] = useState(false);
  const [routeStops, setRouteStops] = useState<Stop[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchTripDetails(Number(id));
    } else {
      setError("No trip ID provided.");
    }
  }, [id]);

  const fetchTripDetails = async (tripId: number) => {
    setLoading(true);
    try {
      const data = await tripAPI.getById(tripId);
      setTrip(data);
      // Geocode destination if trip is in progress
      if (data.status === 'in_progress' || data.status === 'scheduled') {
          // We can use Nominatim to get target coords for geofencing
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.end_location)}`)
            .then(res => res.json())
            .then(results => {
                if (results && results[0]) {
                    setDestCoords({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
                }
            });
      }

      // Fetch route stops if part of a route
      if (data.route_id) {
          try {
              const routeData = await routesAPI.getById(data.route_id);
              // Fetch all trips for this route to show stops using the centralized API
              const fullDetails = await routesAPI.getFullDetailedRoute(data.route_id);
              if (fullDetails.trips) {
                  setRouteStops(fullDetails.trips.map((t: any) => ({
                      id: t.id,
                      employee_name: t.employee_name,
                      sequence_number: t.sequence_number,
                      status: t.status,
                      location: t.start_location
                  })));
                  setRouteInfo({ start: fullDetails.start_location, end: fullDetails.end_location });
              }
          } catch (err) {
              console.error("Failed to fetch route stops", err);
          }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trip details');
    } finally {
      setLoading(false);
    }
  };

  // ── Geolocation & Geofencing ──
  useEffect(() => {
    if (user?.role !== 'driver' || trip?.status !== 'in_progress') return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const current = { 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude, 
            heading: pos.coords.heading ?? undefined 
        };
        setDriverPos(current);

        // Emit to socket for admin/user tracking
        getSocket().emit('driver:location', {
            driver_id: user.id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading ?? undefined,
            speed: pos.coords.speed ?? undefined
        });

        // Check Geofence (if within 200m of destination)
        if (destCoords && !autoCompleteTriggered) {
            const dist = haversineDistance(current.lat, current.lng, destCoords.lat, destCoords.lng);
            if (dist < 0.2) { // 200 meters
                handleAutoCompletion();
            }
        }
      },
      (err) => console.error("GPS Watch Error", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user?.role, trip?.status, destCoords, autoCompleteTriggered]);

  const handleAutoCompletion = async () => {
      if (!trip || autoCompleteTriggered) return;
      setAutoCompleteTriggered(true);
      try {
          await tripAPI.completeTrip(trip.id);
          notify.success("Destination reached! Trip completed automatically.");
          setTrip(prev => prev ? { ...prev, status: 'completed' } : null);
      } catch (err) {
          console.error("Auto-completion failed", err);
          setAutoCompleteTriggered(false);
      }
  };

  const handleBack = () => {
    if (user?.role === 'driver') {
      navigate('/driver');
    } else {
      navigate('/user');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 4) {
      notify.error("Please enter a valid 4-digit OTP");
      return;
    }
    setVerifying(true);
    try {
      if (!trip) return;
      await tripAPI.verifyTripOTP(trip.id, otp);
      notify.success("OTP Verified! Trip started.");
      setTrip({ ...trip, status: 'in_progress' });
      // Auto-launch maps
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.start_location)}&destination=${encodeURIComponent(trip.end_location)}`, '_blank');
    } catch (err: any) {
      notify.error(err.message || 'OTP Verification Failed');
    } finally {
      setVerifying(false);
    }
  };

  const startNavigation = () => {
    if (!trip) return;
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.start_location)}&destination=${encodeURIComponent(trip.end_location)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-gray-900 mb-2">Trip Details</h1>
          <p className="text-gray-600">View comprehensive information about this trip</p>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading trip details...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : trip ? (
          <>
            {/* Trip Timeline Info */}
            <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl border-none shadow-xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Navigation className="w-32 h-32 rotate-12" />
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white">Route Info</h2>
                {trip.sequence_number && (
                  <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 text-white">Stop</span>
                    <span className="text-lg font-black">{trip.sequence_number}</span>
                    <span className="text-[10px] font-bold opacity-60">/ {routeStops.length || '?'}</span>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Pickup Location</p>
                      <p className="font-bold text-lg leading-tight">{trip.start_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Pickup Time</p>
                      <p className="font-bold">{new Date(trip.scheduled_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Drop Location</p>
                      <p className="font-bold text-lg leading-tight">{trip.end_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Current Status</p>
                      <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest mt-1 bg-white text-emerald-700 uppercase`}>
                        {trip.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Multi-stop Stepper (Driver only) */}
              {user?.role === 'driver' && routeStops.length > 1 && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.25em] mb-4">Journey Timeline</p>
                  <div className="flex items-center gap-1 overflow-x-auto pb-4 custom-scrollbar-hidden">
                    {routeStops.map((stop, i) => (
                      <div key={stop.id} className="flex items-center shrink-0">
                         <div className={`flex flex-col items-center group relative ${trip.id === stop.id ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                              stop.status === 'completed' ? 'bg-emerald-400 text-white' :
                              trip.id === stop.id ? 'bg-white text-emerald-600 scale-110 shadow-lg' :
                              'bg-emerald-800 text-emerald-300'
                            }`}>
                              {stop.sequence_number}
                            </div>
                            <div className="absolute -bottom-5 w-24 text-center">
                               <p className="text-[8px] font-black uppercase truncate px-2">{stop.employee_name}</p>
                            </div>
                         </div>
                         {i < routeStops.length - 1 && (
                           <div className={`w-8 h-0.5 mx-1 mb-4 ${stop.status === 'completed' ? 'bg-emerald-400' : 'bg-emerald-800'}`} />
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Map Preview for Driver */}
              {(trip.status === 'in_progress' || trip.status === 'scheduled') && (
                <div className="mt-8 bg-white/10 rounded-2xl overflow-hidden h-96 border border-white/20">
                  <GoogleMap
                    origin={routeInfo?.start || trip.start_location}
                    destination={routeInfo?.end || trip.end_location}
                    waypoints={routeStops.map(s => ({ location: s.location, stopover: true }))}
                    driverLocation={driverPos || undefined}
                  />
                </div>
              )}
            </Card>

            {/* Profiles & Contacts */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">

              {/* Conditional Profile Card (Shows Driver to Employee, Shows Employee to Driver) */}
              {user?.role === 'driver' ? (
                // Show Employee Information to Driver
                <Card className="p-6 bg-white rounded-2xl border-none shadow-md">
                  <h3 className="text-gray-900 mb-4">Passenger Information</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {trip.employee_name ? trip.employee_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold text-lg">{trip.employee_name || 'Unknown Passenger'}</p>
                      <p className="text-gray-500">Employee Passenger</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="font-medium">{trip.employee_phone || 'Number Hidden'}</span>
                    </div>
                    {trip.employee_phone && (
                      <a href={`tel:${trip.employee_phone}`} className="block w-full mt-4">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold mb-4">
                          <Phone className="w-4 h-4" /> Call Passenger
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Driver Actions Based on Trip Status */}
                  {trip.status === 'scheduled' && (
                    <div className="mt-6 border-t border-gray-100 pt-6">
                      <h4 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600" /> Verify passenger OTP to start trip
                      </h4>
                      <div className="flex gap-3">
                        <Input
                          type="text"
                          placeholder="4-digit OTP"
                          maxLength={4}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="text-center font-mono text-xl tracking-[0.2em] font-bold"
                        />
                        <Button 
                          onClick={handleVerifyOTP} 
                          disabled={verifying || otp.length !== 4}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full"
                        >
                          {verifying ? 'Verifying...' : 'Verify & Start'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {trip.status === 'in_progress' && (
                    <div className="mt-6 border-t border-gray-100 pt-6 space-y-4">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-blue-900 font-bold text-sm">Trip in Progress</p>
                          <p className="text-blue-700 text-xs">This trip will automatically complete once the estimated travel time has elapsed.</p>
                        </div>
                      </div>
                      <Button 
                        onClick={startNavigation}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold h-12 rounded-xl shadow-lg shadow-blue-200"
                      >
                        <Navigation className="w-5 h-5" /> Open in Google Maps
                      </Button>
                    </div>
                  )}
                </Card>
              ) : (
                // Show Driver Information to Employee
                <Card className="p-6 bg-white rounded-2xl border-none shadow-md">
                  <h3 className="text-gray-900 mb-4">Driver Information</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {trip.driver_name ? trip.driver_name.charAt(0).toUpperCase() : 'T'}
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold text-lg">{trip.driver_name || 'Not Assigned Yet'}</p>
                      {trip.driver_name && <p className="text-yellow-500 text-sm font-semibold">⭐ 4.8 / 5.0</p>}
                    </div>
                  </div>
                  {trip.driver_name && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-medium">{trip.driver_phone || 'Number strictly hidden'}</span>
                      </div>

                      {trip.driver_phone && (
                        <a href={`tel:${trip.driver_phone}`} className="block w-full mt-4">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold flex items-center justify-center">
                            <Phone className="w-4 h-4" /> Call Driver
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                </Card>
              )}

              {/* Vehicle Information */}
              <Card className="p-6 bg-white rounded-2xl border-none shadow-md">
                <h3 className="text-gray-900 mb-4">Vehicle Information</h3>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
                    <Car className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold text-2xl tracking-wide">{trip.vehicle_number || 'TBD'}</p>
                    <p className="text-gray-500  text-xs tracking-wider">License Plate</p>
                  </div>
                </div>
                {trip.vehicle_number && (
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-2"><User className="w-4 h-4" /> Authorized Capacity</span>
                      <span className="text-gray-900 font-semibold text-sm bg-gray-100 px-3 py-1 rounded-full">{trip.vehicle_number ? 'Standard' : 'N/A'}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

          </>
        ) : (
          <div className="text-gray-500 text-center py-10">Trip not found</div>
        )}
      </div>
    </div>
  );
}