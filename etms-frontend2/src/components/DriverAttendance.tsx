import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Route as RouteIcon, Calendar, Car,
  CreditCard, MessageSquare, LogOut, Menu, X, CheckCircle, XCircle,
  Clock, MapPin, Users, UserCheck, AlertCircle, RefreshCw, UserCog,
  Lock, ArrowRight, Play, CheckCircle2, Phone, Navigation,
} from 'lucide-react';
import { tripAPI } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table';
import { useAuth } from '../context/AuthContext';
import TranzoLogo from './TranzoLogo';
import { driverAPI, routesAPI } from '../services/api';
import GoogleMap from './GoogleMap';
import { socket, connectSocket, joinTripRoom, listenForLocationUpdate, listenForTripStatus } from '../services/socket';


function statusBadgeClass(status: string) {
  if (status === 'completed') return 'bg-green-100 text-green-700';
  if (status === 'in_progress') return 'bg-emerald-100 text-emerald-700';
  if (status === 'scheduled') return 'bg-gray-100 text-gray-700';
  if (status === 'cancelled') return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-600';
}

export default function DriverAttendance() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [driverData, setDriverData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifyingTrip, setVerifyingTrip] = useState<number | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const handleVerifyOtp = async (tripId: number) => {
    if (otpInput.length !== 4) {
      setOtpError('OTP must be 4 digits');
      return;
    }
    setOtpError('');
    try {
      await tripAPI.verifyOtp(tripId, otpInput);
      setVerifyingTrip(null);
      setOtpInput('');
      fetchData(); // refresh
    } catch (err: any) {
      setOtpError(err.message || 'Invalid OTP');
    }
  };


  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/driver' },
    { id: 'routes', label: 'Assigned Routes', icon: RouteIcon, path: '/driver/routes' },
    { id: 'schedule', label: 'Pickup Status', icon: Calendar, path: '/driver/attendance' },
    { id: 'vehicle', label: 'Vehicle Details', icon: Car, path: '/driver/vehicle-details' },
    { id: 'payments', label: 'My Payments', icon: CreditCard, path: '/driver/payments' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/driver/feedback' },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await driverAPI.getMyProfile();
      setDriverData(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    
    const cleanupTripStatus = listenForTripStatus((data) => {
      console.log('🔄 Trip status update detected:', data);
      fetchData();
    });

    return () => {
      clearInterval(interval);
      cleanupTripStatus();
    };
  }, [fetchData]);

  useEffect(() => {
    if (selectedRoute?.id && !String(selectedRoute.id).startsWith('temp-')) {
      joinTripRoom(selectedRoute.id);
      return listenForLocationUpdate((data) => {
        // For driver, we might just want to show their own reported location if needed, 
        // but usually the driver's map shows where they are.
        setCurrentLocation({ lat: data.latitude, lng: data.longitude });
        setLastUpdated(new Date());
      });
    }
  }, [selectedRoute]);

  const trips: any[] = driverData?.trips || [];
  const stats = driverData?.stats;
  const driver = driverData?.driver;

  const today = new Date().toISOString().split('T')[0];
  const todayTrips = trips.filter(t => t.scheduled_time && t.scheduled_time.startsWith(today));
  const activeTrip = trips.find(t => t.status === 'in_progress');

  const todayScheduled = todayTrips.filter(t => t.status === 'scheduled').length;
  const todayCompleted = todayTrips.filter(t => t.status === 'completed').length;
  const todayInProgress = todayTrips.filter(t => t.status === 'in_progress').length;

  // Stat cards matching Admin dashboardStats pattern
  const summaryStats = [
    { label: "Today's Total", value: loading ? '—' : String(stats?.today_total ?? 0), icon: Users, color: 'bg-emerald-500' },
    { label: 'Completed', value: loading ? '—' : String(todayCompleted), icon: CheckCircle, color: 'bg-green-500' },
    { label: 'In Progress', value: loading ? '—' : String(todayInProgress), icon: RouteIcon, color: 'bg-teal-500' },
    { label: 'Scheduled', value: loading ? '—' : String(todayScheduled), icon: Clock, color: 'bg-orange-500' },
  ];

  // Group trips into routes for the 2-card layout
  const routesData = useMemo(() => {
    const groupedMap = new Map();
    trips
      .filter(t => t.status === 'scheduled' || t.status === 'in_progress')
      .forEach((trip: any) => {
        const rid = trip.route_id || `temp-${trip.id}`;
        if (!groupedMap.has(rid)) {
          groupedMap.set(rid, {
            id: rid,
            route_name: trip.route_name || `${trip.start_location} → ${trip.end_location}`,
            status: trip.status,
            passengers: [],
            distance: trip.distance || 0,
            estimated_duration: trip.estimated_duration || 0,
            start_location: trip.route_start || trip.start_location,
            end_location: trip.route_end || trip.end_location,
            waypoints: Array.isArray(trip.route_waypoints) ? trip.route_waypoints : []
          });
        }
        
        const r = groupedMap.get(rid);
        r.passengers.push({
          id: trip.id,
          name: trip.employee_name,
          pickup: trip.start_location,
          phone: trip.employee_phone || trip.phone,
          status: trip.status,
          otp_required: trip.status === 'scheduled'
        });
        
        // Prioritize in_progress status for the grouping
        if (trip.status === 'in_progress') r.status = 'in_progress';
      });
    return Array.from(groupedMap.values());
  }, [trips]);

  // Auto-select first route if none selected
  useEffect(() => {
    if (routesData.length > 0) {
      if (!selectedRoute) {
        // Initial selection: prefer in_progress, else first
        setSelectedRoute(routesData.find((r: any) => r.status === 'in_progress') || routesData[0]);
      } else {
        // Update current selection from fresh data if something changed
        const updated = routesData.find((r: any) => r.id === selectedRoute.id);
        if (updated && (updated.status !== selectedRoute.status || updated.passengers.length !== selectedRoute.passengers.length)) {
          setSelectedRoute(updated);
        }
      }
    }
  }, [routesData, selectedRoute?.id]); // Only re-run if routesData source changes or we switch IDs

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-emerald-700 to-teal-700 text-white w-64 transform transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl`}>
        <div className="p-6 border-b border-emerald-600">
          <TranzoLogo size="medium" showText={true} />
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.id === 'schedule'
                  ? 'bg-white text-emerald-700 shadow-lg'
                  : 'text-emerald-100 hover:bg-emerald-600'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          <div className="bg-emerald-600 rounded-xl p-3 cursor-pointer hover:bg-emerald-500 transition-colors" onClick={() => navigate('/profile')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <UserCog className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.full_name || 'Driver'}</p>
                <p className="text-emerald-200 text-xs truncate">{user?.email || 'driver@company.com'}</p>
              </div>
            </div>
          </div>
          <Button onClick={handleLogout} className="w-full flex items-center gap-3 bg-red-500 hover:bg-red-600 rounded-xl">
            <LogOut className="w-5 h-5" /><span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar — matches Admin exactly */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                {sidebarOpen ? <X /> : <Menu />}
              </Button>
              <div>
                <h1 className="text-gray-900 font-bold">Pickup Status</h1>
              </div>
            </div>
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="p-6 space-y-6">

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* ── Stat Cards — same pattern as Admin dashboardStats ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="p-6 rounded-2xl shadow-lg border-none bg-white hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 mb-1">{stat.label}</p>
                      <h3 className="text-gray-800 mb-1">{stat.value}</h3>
                      <p className="text-gray-500">
                        {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>


          {/* Today's Trips Table — matches Admin "Recent Activity" */}
          <Card className="rounded-2xl shadow-lg border-none bg-white">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-gray-800">Today's Trip Assignments</h2>
                <p className="text-gray-500">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className="text-sm text-gray-400 font-medium">
                {loading ? '…' : `${todayTrips.length} trip${todayTrips.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="p-6 overflow-x-auto">
              {loading ? (
                <div className="text-center py-10 text-gray-400">Loading trips…</div>
              ) : todayTrips.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">No trips scheduled for today</p>
                  <p className="text-gray-400">Trips scheduled for today will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Passenger</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayTrips.map((trip) => (
                      <TableRow 
                        key={trip.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => navigate(`/driver/transport-details/${trip.id}`)}
                      >
                        <TableCell className="font-medium text-gray-900">
                          {new Date(trip.scheduled_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-800 max-w-[180px] truncate">
                            {trip.route_name || `${trip.start_location} → ${trip.end_location}`}
                          </div>
                        </TableCell>
                        <TableCell>{trip.employee_name || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="text-sm text-gray-600 max-w-[140px] truncate">{trip.start_location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{trip.vehicle_number || driver?.vehicle_number || '—'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(trip.status)}`}>
                            {trip.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                            {trip.status === 'in_progress' && <RouteIcon className="w-3 h-3" />}
                            {trip.status === 'scheduled' && <Clock className="w-3 h-3" />}
                            {trip.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                            {trip.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {trip.status === 'scheduled' && (
                            verifyingTrip === trip.id ? (
                              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-emerald-200">
                                <Lock className="w-4 h-4 text-emerald-600" />
                                <input
                                  type="text"
                                  maxLength={4}
                                  placeholder="OTP"
                                  className="w-16 bg-white border border-gray-200 rounded-md px-2 py-1 text-sm text-center outline-none focus:border-emerald-500"
                                  value={otpInput}
                                  onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                                  autoFocus
                                />
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 px-2 rounded-lg" onClick={() => handleVerifyOtp(trip.id)}>
                                  <ArrowRight className="w-4 h-4 text-white" />
                                </Button>
                                {otpError && <span className="absolute mt-12 text-[10px] text-red-500 font-medium">{otpError}</span>}
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => { setVerifyingTrip(trip.id); setOtpInput(''); setOtpError(''); }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200"
                              >
                                <Play className="w-4 h-4 mr-1" /> Start Trip
                              </Button>
                            )
                          )}
                          {trip.status === 'in_progress' && (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] animate-pulse">
                              <CheckCircle size={12} />
                              AUTO-ENDING
                            </div>
                          )}
                          {trip.status !== 'scheduled' && trip.status !== 'in_progress' && (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>

          {/* ── 2-Column Map Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT CARD - TRIP DETAILS */}
            <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">Route Details</h2>
              </div>
              
              {routesData.length > 0 ? (
                <>
                  <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                    {routesData.map((route: any) => (
                      <div 
                        key={route.id}
                        onClick={() => setSelectedRoute(route)}
                        className={`border rounded-xl p-4 transition-all cursor-pointer ${
                          selectedRoute?.id === route.id ? 'border-emerald-500 bg-emerald-50/10 shadow-sm' : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <span className="truncate max-w-[120px]">{route.start_location.split(',')[0]}</span>
                            <span className="text-green-600">→</span>
                            <span className="font-semibold truncate max-w-[120px]">{route.end_location.split(',')[0]}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            route.status === 'in_progress' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {route.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Passenger List */}
                        <div className="space-y-3 mt-3">
                          {route.passengers.map((p: any) => (
                            <div key={p.id} className="bg-white border border-gray-100 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                                    {p.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                                    <p className="text-[10px] text-gray-500 truncate max-w-[180px]">{p.pickup.split(',')[0]}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {p.phone && (
                                    <button 
                                      className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); window.location.href = `tel:${p.phone}`; }}
                                    >
                                      <Phone size={14} />
                                    </button>
                                  )}
                                  {p.status === 'scheduled' && (
                                    <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-md font-medium">Pending OTP</span>
                                  )}
                                  {p.status === 'in_progress' && (
                                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-md font-medium">In Progress</span>
                                  )}
                                </div>
                              </div>

                              {/* OTP Verification for this specific passenger */}
                              {selectedRoute?.id === route.id && p.status === 'scheduled' && (
                                <div className="mt-3 flex items-center gap-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                  <Lock size={14} className="text-emerald-600" />
                                  <input
                                    type="text"
                                    placeholder="Enter 4-digit OTP"
                                    className="flex-1 bg-white border border-gray-200 rounded-md px-2 py-1 text-sm outline-none focus:border-emerald-500"
                                    value={verifyingTrip === p.id ? otpInput : ''}
                                    onChange={(e) => {
                                      setVerifyingTrip(p.id);
                                      setOtpInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
                                    }}
                                  />
                                  <Button 
                                    size="sm" 
                                    className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3 rounded-md text-xs"
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleVerifyOtp(p.id); }}
                                    disabled={otpInput.length !== 4 || verifyingTrip !== p.id}
                                  >
                                    Start
                                  </Button>
                                </div>
                              )}
                              {otpError && verifyingTrip === p.id && (
                                <p className="text-[10px] text-red-500 mt-1 ml-1">{otpError}</p>
                              )}
                              
                              {p.status === 'in_progress' && (
                                <div className="mt-2 text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle size={10} />
                                  Trip will end automatically upon arrival
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Metrics */}
                        <div className="flex gap-4 mt-4 pt-3 border-t border-gray-50 text-xs font-semibold text-gray-500">
                          <div className="flex items-center gap-1">
                            <RouteIcon size={12} />
                            <span>{route.distance || 0} km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{route.estimated_duration || 0} min</span>
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
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">No Active Routes</h3>
                  <p className="text-gray-500 text-sm max-w-[200px]">Waiting for database route assignments...</p>
                </div>
              )}
            </div>

            {/* RIGHT CARD - LIVE TRACKING MAP */}
            <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">Live Navigation</h2>
                {selectedRoute?.status === 'in_progress' && (
                  <span className="bg-green-100 text-green-600 text-[10px] px-3 py-1 font-black rounded-full animate-pulse border border-green-200">
                    LIVE TRACKING
                  </span>
                )}
              </div>

              <div className="rounded-xl overflow-hidden flex-1 border border-gray-100 relative group">
                {selectedRoute ? (
                  <GoogleMap
                    origin={selectedRoute.start_location}
                    destination={selectedRoute.end_location}
                    waypoints={selectedRoute.waypoints.map((s: string) => ({ location: s, stopover: true }))}
                    driverLocation={currentLocation || undefined}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-sm font-medium">Initializing satellite tracking...</p>
                  </div>
                )}
                
                {selectedRoute && (
                  <Button
                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white shadow-xl border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold gap-2 transition-all opacity-0 group-hover:opacity-100"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedRoute.start_location)}&destination=${encodeURIComponent(selectedRoute.end_location)}`, '_blank')}
                  >
                    <Navigation size={14} className="text-emerald-600" />
                    Google Maps
                  </Button>
                )}
              </div>

              {selectedRoute && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Current Target</p>
                      <p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">
                        {selectedRoute.end_location}
                      </p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Estimated</p>
                       <p className="text-sm font-bold text-emerald-600">{selectedRoute.estimated_duration} MINS</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
