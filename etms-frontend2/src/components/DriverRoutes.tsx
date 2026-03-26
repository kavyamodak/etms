import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Route as RouteIcon, Calendar, Car, CreditCard, MessageSquare,
  LogOut, Menu, X, MapPin, Clock, Users, Map, ExternalLink,
  Milestone, Radio, TrendingUp, UserCog, Navigation, ArrowRight, CheckCircle,
  ArrowLeft, Maximize2, AlertCircle,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table';
import { useAuth } from '../context/AuthContext';
import TranzoLogo from './TranzoLogo';
import { routesAPI } from '../services/api';
import { getSocket } from '../services/socket';
import MapRouteLeaflet from './MapRouteLeaflet';


interface DriverTrip {
  id: number;
  route_name: string;
  start_location: string;
  end_location: string;
  scheduled_time: string;
  status: string;
  vehicle_number?: string;
  employee_name?: string;
  created_at: string;
}

// ── Driver Map Modal (Leaflet-based) ──────────────────────────────
function DriverMapModal({ route, onClose }: { route: DriverTrip; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-5xl overflow-hidden flex flex-col animate-in zoom-in duration-300 h-[85vh]">
        {/* Header */}
        <div className="px-8 py-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 rotate-3">
              <Navigation className="w-6 h-6 text-white -rotate-3" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 tracking-[0.2em] mb-0.5">Navigation</p>
              <h3 className="text-xl font-black text-gray-900">{route.route_name || 'Assigned Trip'}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 bg-gray-50 overflow-hidden">
          <MapRouteLeaflet 
            pickupPoints={[{
              address: route.start_location,
            }]}
            destination={{ address: route.end_location }}
          />
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="text-sm text-gray-600">
            <p><strong>From:</strong> {route.start_location}</p>
            <p><strong>To:</strong> {route.end_location}</p>
          </div>
          <Button onClick={onClose} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
            Close Navigation
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Google Maps Modal (Legacy) ─────────────────────────────────────
function GoogleMapsModal({ route, onClose }: { route: DriverTrip; onClose: () => void }) {
  const MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const origin = encodeURIComponent(route.start_location);
  const destination = encodeURIComponent(route.end_location);

  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  const embedUrl = MAPS_API_KEY
    ? `https://www.google.com/maps/embed/v1/directions?key=${MAPS_API_KEY}&origin=${origin}&destination=${destination}&mode=driving`
    : null;

  const statusColors: Record<string, string> = {
    active: 'from-green-500 to-emerald-600',
    planned: 'from-blue-500 to-teal-600',
    completed: 'from-gray-600 to-gray-700',
    cancelled: 'from-red-500 to-rose-600',
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div
        className="relative bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Advanced Header */}
        <div className="relative px-8 py-8 bg-white border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${statusColors[route.status] || 'from-emerald-500 to-teal-600'} flex items-center justify-center shadow-lg transform rotate-3`}>
                <Map className="w-7 h-7 text-white -rotate-3" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600 mb-1">Trip Assignment</p>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight">{route.route_name || 'Assigned Trip'}</h3>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-50 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-700">1</span>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dual Pane Body */}
        <div className="flex flex-col lg:flex-row h-[600px] lg:h-[500px]">
          {/* Enhanced Placeholder Pane */}
          <div className="flex-1 bg-emerald-50 relative overflow-hidden order-1 lg:order-2 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 ring-1 ring-emerald-100">
              <Navigation className="w-12 h-12 text-emerald-600" />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2">Ready to Navigate?</h4>
            <p className="text-gray-600 text-sm max-w-xs mx-auto mb-8">
              Open this route in Google Maps for live directions and real-time traffic updates.
            </p>
            <Button 
              onClick={() => window.open(mapsDirectionsUrl, '_blank')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 rounded-2xl text-lg font-bold shadow-xl shadow-emerald-200 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
            >
              <ExternalLink className="w-6 h-6" />
              Open Navigation
            </Button>

            {/* Overlay Status Badge */}
            <div className="absolute top-6 right-6">
              <span className={`px-4 py-2 rounded-xl text-white text-[10px] font-bold capitalize shadow-lg bg-gradient-to-r ${statusColors[route.status] || 'from-emerald-500 to-teal-600'}`}>
                {route.status}
              </span>
            </div>
          </div>

          {/* Stepper Pane (Scrollable) */}
          <div className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-r border-gray-100 overflow-y-auto bg-white p-8 custom-scrollbar order-2 lg:order-1">
            <p className="text-[10px] font-bold text-emerald-600  tracking-[0.2em] mb-10">Journey Path</p>
            <div className="space-y-12">
              {/* Start */}
              <div className="relative pl-12 text-left">
                <div className="absolute left-[19px] top-6 bottom-[-48px] w-0.5 bg-emerald-50" />
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white shadow-lg flex items-center justify-center z-10">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-500  tracking-widest mb-1.5">Pickup</p>
                  <p className="text-gray-900 font-bold text-base leading-snug">{route.start_location}</p>
                </div>
              </div>

              {/* End */}
              <div className="relative pl-12 text-left">
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center z-10">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-red-500  tracking-widest mb-1.5">Drop-off</p>
                  <p className="text-gray-900 font-bold text-base leading-snug">{route.end_location}</p>
                </div>
              </div>
            </div>

            {/* Path Footer */}
            <div className="mt-12 p-6 bg-emerald-50 rounded-2xl border border-emerald-100/50">
              <div className="flex items-center justify-between py-2 border-b border-emerald-100/50">
                <span className="text-[9px] font-bold text-gray-400  tracking-widest">Scheduled</span>
                <span className="text-xs font-bold text-gray-900">{new Date(route.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[9px] font-bold text-gray-400  tracking-widest">Employee</span>
                <span className="text-xs font-bold text-emerald-700">{route.employee_name || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Footer */}
        <div className="px-8 py-6 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs font-bold italic">
            {route.status === 'completed'
              ? 'Trip successfully completed. Thank you!'
              : route.status === 'cancelled'
                ? 'This trip was cancelled.'
                : 'Safe travels! Remember to update your status at each stop.'}
          </p>
          {route.status !== 'completed' && route.status !== 'cancelled' && (
            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white text-xs font-black  tracking-[0.2em] px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              Launch Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DriverRoutes() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routes, setRoutes] = useState<DriverTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapModal, setMapModal] = useState<{ open: boolean; route: DriverTrip | null }>({ open: false, route: null });
  const [gpsActive, setGpsActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // ── Socket.IO: join as driver + stream GPS (only if permission granted) ──
  useEffect(() => {
    if (!user?.id) return;
    const sock = getSocket();
    sock.emit('driver:join', { driver_id: user.id });

    if ('geolocation' in navigator) {
      // Check permission state before calling watchPosition to avoid spam
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          // Permission already denied — skip silently, no error spam
          setGpsActive(false);
          return;
        }
        // Granted or prompt — attempt to watch
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            setGpsActive(true);
            sock.emit('driver:location', {
              driver_id: user.id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              speed: pos.coords.speed ?? undefined,
              heading: pos.coords.heading ?? undefined,
              accuracy: pos.coords.accuracy,
            });
          },
          () => {
            // Silently mark GPS as off — no console.warn spam
            setGpsActive(false);
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      }).catch(() => {
        // permissions API not supported — try once, fail silently
        setGpsActive(false);
      });
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [user?.id]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/driver' },
    { id: 'routes', label: 'Assigned Routes', icon: RouteIcon, path: '/driver/routes' },
    { id: 'schedule', label: 'Pickup Status', icon: Calendar, path: '/driver/attendance' },
    { id: 'vehicle', label: 'Vehicle Details', icon: Car, path: '/driver/vehicle-details' },
    { id: 'payments', label: 'My Payments', icon: CreditCard, path: '/driver/payments' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/driver/feedback' },
  ];

  useEffect(() => {
    import('../services/api').then(({ driverAPI }) => {
      driverAPI.getMyProfile()
        .then((data: any) => {
          const trips = data.trips || [];
          const normalised: DriverTrip[] = trips.map((r: any) => ({
            id: Number(r.id),
            route_name: String(r.route_name || ''),
            start_location: String(r.start_location || ''),
            end_location: String(r.end_location || ''),
            scheduled_time: String(r.scheduled_time || ''),
            status: String(r.status || 'scheduled'),
            vehicle_number: String(r.vehicle_number || ''),
            employee_name: String(r.employee_name || ''),
            created_at: String(r.created_at || ''),
          }));
          setRoutes(normalised);
        })
        .catch(() => setRoutes([]))
        .finally(() => setLoading(false));
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'planned': return 'bg-gray-100 text-gray-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Stat cards
  const summaryStats = [
    { label: 'Total Trips', value: String(routes.length), icon: RouteIcon, color: 'bg-emerald-500' },
    { label: 'In Progress', value: String(routes.filter(r => r.status === 'in_progress' || r.status === 'active').length), icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Scheduled', value: String(routes.filter(r => r.status === 'scheduled' || r.status === 'planned').length), icon: Clock, color: 'bg-teal-500' },
    { label: 'Completed', value: String(routes.filter(r => r.status === 'completed').length), icon: CheckCircle, color: 'bg-gray-500' },
  ];

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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.id === 'routes'
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
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{user?.full_name || 'Driver'}</p>
                <p className="text-emerald-200 text-xs">{user?.email || 'driver@company.com'}</p>
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
        {/* Top Bar — matches Admin */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                {sidebarOpen ? <X /> : <Menu />}
              </Button>
              <div>
                <h1 className="text-gray-900 font-bold">Assigned Routes</h1>
              </div>
            </div>
            {/* GPS status pill */}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${gpsActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {gpsActive ? (
                <><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><Radio className="w-3 h-3" /> Live GPS</>
              ) : (
                <><span className="w-2 h-2 bg-gray-400 rounded-full" /> GPS Off</>
              )}
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">

          {/* ── Stat Cards — Admin pattern ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="p-6 rounded-2xl shadow-lg border-none bg-white hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 mb-1">{stat.label}</p>
                      <h3 className="text-gray-800 mb-1">{loading ? '—' : stat.value}</h3>
                    </div>
                    <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-${stat.color.split('-')[1]}-200`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Routes Table — Admin "Recent Activity" pattern */}
          <Card className="rounded-2xl shadow-lg border-none bg-white">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-gray-800">Routes</h2>
              <p className="text-gray-500">All active and planned transport routes</p>
            </div>
            <div className="p-6 overflow-x-auto">
              {loading ? (
                <div className="text-center py-10 text-gray-400">Loading routes…</div>
              ) : routes.length === 0 ? (
                <div className="text-center py-10">
                  <RouteIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">No routes available</p>
                  <p className="text-gray-400">Routes created by the admin will appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-gray-100 bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-600">Date & Time</TableHead>
                      <TableHead className="font-semibold text-gray-600">Route / Journey</TableHead>
                      <TableHead className="font-semibold text-gray-600">Passenger</TableHead>
                      <TableHead className="font-semibold text-gray-600">Status</TableHead>
                      <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((route) => (
                      <TableRow
                        key={route.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/driver/transport-details/${route.id}`)}
                      >
                        <TableCell>
                          <p className="font-medium text-gray-800">
                            {new Date(route.scheduled_time).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(route.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-gray-800">{route.route_name}</p>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{route.start_location} → {route.end_location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-gray-800 font-medium">
                            <Users className="w-4 h-4 text-gray-400" />
                            {route.employee_name || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-4 py-1.5 rounded-full inline-block text-[10px] font-bold capitalize tracking-wide ${getStatusColor(route.status)}`}>
                            {route.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {route.status !== 'completed' && route.status !== 'cancelled' ? (
                            <Button
                              size="sm"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setMapModal({ open: true, route }); }}
                              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm shadow-emerald-200 transition-all hover:scale-105"
                            >
                              <Map className="w-3 h-3" /> View Route
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs font-medium">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {mapModal.open && mapModal.route && (
        <DriverMapModal route={mapModal.route} onClose={() => setMapModal({ open: false, route: null })} />
      )}
    </div>
  );
}
