import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Car, Route as RouteIcon, TrendingUp,
    CreditCard, FileText, LogOut, Menu, X, UserCog,
    MapPin, Clock, User, Radio, Map, ExternalLink, Milestone,
    Navigation, ChevronRight, Wifi, WifiOff, Flag
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import TranzoLogo from './TranzoLogo';
import { tripAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import GoogleMap from './GoogleMap';

// ── Types ────────────────────────────────────────────────────────
interface LiveTrip {
    id: number;
    employee_name: string;
    driver_name?: string;
    driver_id?: number;
    vehicle_number?: string;
    vehicle_type?: string;
    start_location: string;
    end_location: string;
    scheduled_time: string;
    status: string;
}

interface DriverLocation {
    driver_id: number;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    trip_id?: number;
    timestamp: string;
}

// ── Live Map Modal (Google Maps based) ───────────────────────────
function LiveMapModal({
    trip,
    location,
    onClose,
}: {
    trip: LiveTrip;
    location?: DriverLocation;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-white/20">

                {/* Header */}
                <div className="px-8 py-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 rotate-2">
                            <Radio className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                <p className="text-[10px] font-black text-emerald-600 tracking-[0.2em] uppercase">Tactical Live Tracking</p>
                            </div>
                            <h3 className="text-xl font-black text-gray-900">{trip.employee_name}</h3>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {location && (
                             <div className="flex flex-col items-end">
                                <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Current Velocity</p>
                                <p className="text-lg font-black text-emerald-600">{location.speed ? Math.round(location.speed) : '0'} <span className="text-[10px] text-gray-400">KM/H</span></p>
                            </div>
                        )}
                        <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all border border-gray-100">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Map Area */}
                    <div className="flex-1 relative bg-gray-50">
                        <GoogleMap 
                          origin={trip.start_location}
                          destination={trip.end_location}
                          driverLocation={location ? { lat: location.latitude, lng: location.longitude, heading: location.heading } : undefined}
                        />
                    </div>

                    {/* Logistics Sidebar */}
                    <div className="w-full lg:w-[400px] bg-white border-l border-gray-100 shrink-0 overflow-y-auto p-8 flex flex-col">
                        <div className="mb-10">
                            <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-6">Mission Details</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="p-4 bg-gray-50 border-none rounded-2xl">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle</p>
                                    <p className="text-sm font-black text-gray-800">{trip.vehicle_number || 'TRZ-UNIT'}</p>
                                </Card>
                                <Card className="p-4 bg-gray-50 border-none rounded-2xl">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Driver</p>
                                    <p className="text-sm font-black text-gray-800 truncate">{trip.driver_name || 'Assigned'}</p>
                                </Card>
                            </div>
                        </div>

                        <div className="space-y-10 flex-1">
                             <div className="relative pl-10">
                                <div className="absolute left-[15px] top-4 bottom-[-40px] w-0.5 bg-gray-100" />
                                <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white shadow-lg flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-emerald-600 tracking-widest uppercase mb-1">Origin</p>
                                    <p className="text-gray-900 font-bold text-sm leading-tight">{trip.start_location}</p>
                                </div>
                            </div>

                            {location && (
                                <div className="relative pl-10">
                                    <div className="absolute left-[15px] top-4 bottom-[-40px] w-0.5 bg-gray-100" />
                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-blue-500 border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    </div>
                                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
                                        <p className="text-[9px] font-black text-blue-600 tracking-widest uppercase mb-1">Live Signal</p>
                                        <p className="text-gray-900 font-mono text-xs font-black">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                                            <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Active Ping</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="relative pl-10">
                                <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center">
                                    <Flag className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-red-600 tracking-widest uppercase mb-1">Target</p>
                                    <p className="text-gray-900 font-bold text-sm leading-tight">{trip.end_location}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 border-t border-gray-100">
                             <Button 
                                className="w-full bg-gray-900 hover:bg-black text-white rounded-2xl h-14 font-black tracking-widest uppercase text-xs gap-3 shadow-xl"
                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.end_location)}`, '_blank')}
                             >
                                <ExternalLink className="w-4 h-4" /> Open External Radar
                             </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Trip Progress Bar ────────────────────────────────────────────
function TripProgress({ scheduledTime }: { scheduledTime: string }) {
    return (
        <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="font-bold text-emerald-600">Active Journey</span>
                </div>
                <span className="font-mono">In Transit</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"
                    style={{ width: '65%' }}
                />
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────
export default function LiveTracking() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [trips, setTrips] = useState<LiveTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [socketConnected, setSocketConnected] = useState(false);
    const [driverLocations, setDriverLocations] = useState<Record<number, DriverLocation>>({});
    const [mapModal, setMapModal] = useState<{ open: boolean; trip: LiveTrip | null }>({ open: false, trip: null });
    const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { id: 'users', label: 'Employees', icon: Users, path: '/admin/users' },
        { id: 'drivers', label: 'Drivers', icon: UserCog, path: '/admin/drivers' },
        { id: 'vehicles', label: 'Vehicles', icon: Car, path: '/admin/vehicles' },
        { id: 'routes', label: 'Routes', icon: RouteIcon, path: '/admin/routes' },
        { id: 'trips', label: 'Trips', icon: TrendingUp, path: '/admin/trips' },
        { id: 'tracking', label: 'Live Tracking', icon: Radio, path: '/admin/tracking' },
        { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
        { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
    ];

    // ── Fetch active trips ────────────────────────────────────────
    const fetchLiveTrips = useCallback(async () => {
        try {
            const data = await tripAPI.getAll();
            const live: LiveTrip[] = (Array.isArray(data) ? data : [])
                .filter((t: any) => t.status === 'in_progress')
                .map((t: any) => ({
                    id: Number(t.id),
                    employee_name: String(t.employee_name || '—'),
                    driver_name: t.driver_name || undefined,
                    driver_id: t.driver_id ? Number(t.driver_id) : undefined,
                    vehicle_number: t.vehicle_number || undefined,
                    vehicle_type: t.vehicle_type || undefined,
                    start_location: String(t.start_location || ''),
                    end_location: String(t.end_location || ''),
                    scheduled_time: String(t.scheduled_time || ''),
                    status: String(t.status),
                }));
            setTrips(live);
            setLastUpdated(new Date());
        } catch {
            // keep old data
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Socket.IO setup ───────────────────────────────────────────
    useEffect(() => {
        const sock = getSocket();
        socketRef.current = sock;

        const onConnect = () => {
            setSocketConnected(true);
            sock.emit('admin:joinTracking');
        };
        const onDisconnect = () => setSocketConnected(false);

        const onLocationUpdate = (data: DriverLocation) => {
            setDriverLocations(prev => ({
                ...prev,
                [data.driver_id]: data,
            }));
            setLastUpdated(new Date());
        };

        const onTripStatusChanged = ({ trip_id, status }: { trip_id: number; status: string }) => {
            setTrips(prev => {
                if (status === 'in_progress') return prev; // fetchLiveTrips handles new ones
                return prev.filter(t => t.id !== trip_id);  // remove completed/cancelled
            });
            // Refresh the full list after a short delay
            setTimeout(fetchLiveTrips, 800);
        };

        const onDriverOnline = () => fetchLiveTrips();
        const onDriverOffline = () => fetchLiveTrips();

        sock.on('connect', onConnect);
        sock.on('disconnect', onDisconnect);
        sock.on('location:update', onLocationUpdate);
        sock.on('trip:statusChanged', onTripStatusChanged);
        sock.on('driver:online', onDriverOnline);
        sock.on('driver:offline', onDriverOffline);

        // Set initial state
        setSocketConnected(sock.connected);
        if (sock.connected) sock.emit('admin:joinTracking');

        return () => {
            sock.off('connect', onConnect);
            sock.off('disconnect', onDisconnect);
            sock.off('location:update', onLocationUpdate);
            sock.off('trip:statusChanged', onTripStatusChanged);
            sock.off('driver:online', onDriverOnline);
            sock.off('driver:offline', onDriverOffline);
        };
    }, [fetchLiveTrips]);

    // ── Initial fetch + 10s fallback poll (in case socket misses updates) ──
    useEffect(() => {
        fetchLiveTrips();
        const interval = setInterval(fetchLiveTrips, 10000);
        return () => clearInterval(interval);
    }, [fetchLiveTrips]);

    const handleLogout = () => logout();

    const getDriverLocationForTrip = (trip: LiveTrip): DriverLocation | undefined => {
        if (!trip.driver_id) return undefined;
        return driverLocations[trip.driver_id];
    };

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
                            <button key={item.id} onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.id === 'tracking' ? 'bg-white text-emerald-700 shadow-lg' : 'text-emerald-100 hover:bg-emerald-600'}`}>
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                                {item.id === 'tracking' && trips.length > 0 && (
                                    <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                        {trips.length}
                                    </span>
                                )}
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
                                <p className="text-white font-medium text-sm">{user?.full_name || 'Admin'}</p>
                                <p className="text-emerald-200 text-xs">{user?.email || 'admin@company.com'}</p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleLogout} className="w-full flex items-center gap-3 bg-red-500 hover:bg-red-600 rounded-xl">
                        <LogOut className="w-5 h-5" /><span>Logout</span>
                    </Button>
                </div>
            </aside>

            <div className="lg:ml-64">
                {/* Mobile header */}
                <div className="lg:hidden bg-white shadow-sm p-4 flex items-center gap-3">
                    <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu className="w-6 h-6" /></Button>
                    <TranzoLogo size="small" showText={false} />
                </div>

                {/* Top bar */}
                <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                                {sidebarOpen ? <X /> : <Menu />}
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Radio className="w-5 h-5 text-emerald-600" />
                                    {trips.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                                </div>
                                <h1 className="text-gray-900">Live Trip Tracking</h1>
                                {trips.length > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                                        {trips.length} Active
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Connection status + timestamp */}
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-400 hidden sm:block">
                                Updated: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${socketConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {socketConnected
                                    ? <><Wifi className="w-3.5 h-3.5" /> Socket.IO Live</>
                                    : <><WifiOff className="w-3.5 h-3.5" /> Polling (10s)</>}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-6 space-y-6">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Active Trips', value: trips.length, pulse: trips.length > 0 },
                            { label: 'Drivers on Road', value: trips.filter(t => t.driver_name).length, pulse: false },
                            { label: 'Employees in Transit', value: trips.length, pulse: false },
                            { label: 'GPS Signals Received', value: Object.keys(driverLocations).length, pulse: Object.keys(driverLocations).length > 0 },
                        ].map(({ label, value, pulse }) => (
                            <Card key={label} className="p-4 rounded-2xl border-none shadow-sm bg-white">
                                <p className="text-gray-500 text-xs mb-1">{label}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                                    {pulse && value > 0 && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Trip cards */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">Connecting to live feed…</p>
                            </div>
                        </div>
                    ) : trips.length === 0 ? (
                        <Card className="p-16 rounded-2xl border-none shadow-sm bg-white text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Radio className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-gray-600 font-semibold mb-1">No Active Trips</h3>
                            <p className="text-gray-400 text-sm">Trips with status "In Progress" will appear here in real time.</p>
                            <p className="text-gray-300 text-xs mt-2">
                                {socketConnected ? '🟢 Socket.IO connected — waiting for live events…' : '⚪ Polling every 10 seconds…'}
                            </p>
                            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate('/admin/trips')}>
                                Go to Trips <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {trips.map((trip) => {
                                const loc = getDriverLocationForTrip(trip);
                                return (
                                    <Card key={trip.id} className="p-5 rounded-2xl border border-emerald-100 shadow-md bg-white hover:shadow-lg transition-shadow relative overflow-hidden">
                                        {/* Live badge */}
                                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                            <span className="text-xs text-red-500 font-semibold">LIVE</span>
                                        </div>

                                        {/* Header */}
                                        <div className="flex items-start gap-3 mb-3 pr-16">
                                            <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-xl flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5 text-emerald-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-gray-900 font-semibold text-sm">{trip.employee_name}</h3>
                                                <p className="text-gray-400 text-xs">Trip #{trip.id}</p>
                                            </div>
                                        </div>

                                        {/* Route */}
                                        <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                <span className="truncate font-medium">{trip.start_location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 pl-1">
                                                <div className="w-0.5 h-4 bg-gray-200 ml-1" />
                                                <Navigation className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                <span className="truncate font-medium">{trip.end_location}</span>
                                            </div>
                                        </div>

                                        {/* Driver + Vehicle + GPS */}
                                        <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                                            {trip.driver_name && (
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Driver: <span className="text-gray-700 font-medium">{trip.driver_name}</span></span>
                                                </div>
                                            )}
                                            {trip.vehicle_number && (
                                                <div className="flex items-center gap-2">
                                                    <Car className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{trip.vehicle_type && `${trip.vehicle_type} · `}<span className="text-gray-700 font-medium">{trip.vehicle_number}</span></span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                                <span>Started: {new Date(trip.scheduled_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            {loc ? (
                                                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                                                    <span>
                                                        GPS: {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                                        {loc.speed != null && ` · ${Math.round(loc.speed)} km/h`}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Awaiting GPS signal…</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress bar */}
                                        <TripProgress scheduledTime={trip.scheduled_time} />

                                        {/* Map button */}
                                        <Button
                                            size="sm"
                                            onClick={() => setMapModal({ open: true, trip })}
                                            className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs h-8"
                                        >
                                            <Map className="w-3.5 h-3.5 mr-1.5" />
                                            {loc ? 'Track on Map (Live GPS)' : 'View Route on Map'}
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Backend integration note */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-2">
                        <Milestone className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <strong>Socket.IO is live.</strong> Driver apps must emit{' '}
                            <code className="text-xs bg-blue-100 px-1 rounded">driver:join &#123; driver_id &#125;</code> then{' '}
                            <code className="text-xs bg-blue-100 px-1 rounded">driver:location &#123; driver_id, latitude, longitude, trip_id &#125;</code>{' '}
                            to stream GPS here in real time. REST fallback:{' '}
                            <code className="text-xs bg-blue-100 px-1 rounded">POST /api/location/track</code>.
                        </div>
                    </div>
                </main>
            </div>

            {sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {mapModal.open && mapModal.trip && (
                <LiveMapModal
                    trip={mapModal.trip}
                    location={getDriverLocationForTrip(mapModal.trip)}
                    onClose={() => setMapModal({ open: false, trip: null })}
                />
            )}
        </div>
    );
}
