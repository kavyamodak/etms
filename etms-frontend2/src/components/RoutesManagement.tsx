import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, routesAPI, driverAPI, vehicleAPI, tripAPI, employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Clock, Users, Car, User, Calendar, Plus, Edit, Trash2,
  LayoutDashboard, Menu, X, Route as RouteIcon, TrendingUp, CreditCard,
  FileText, LogOut, UserCog, Navigation, AlertCircle, CheckCircle2,
  Search, ChevronDown, ChevronUp, Milestone, Map as MapIcon, ExternalLink, PlusCircle,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import TranzoLogo from './TranzoLogo';
import AdminRouteMapUI from './AdminRouteMapUI';
import GoogleMap from './GoogleMap';
import { subscribeToAdminTracking, listenForSOSAlert } from '../services/socket';

interface Route {
  id: number;
  route_name: string;
  start_location: string;
  end_location: string;
  start_lat?: number | null;
  start_lng?: number | null;
  end_lat?: number | null;
  end_lng?: number | null;
  distance?: number;
  estimated_duration?: number;
  status: string;
  driver_name?: string;
  vehicle_number?: string;
  max_passengers?: number;
  waypoints?: string[];
  created_at: string;
}

interface Driver {
  id: number;
  full_name: string;
  effective_status?: string;
  status?: string;
  vehicle_number?: string;
}

interface Vehicle {
  id: number;
  vehicle_number: string;
  model?: string;
  vehicle_type?: string;
  capacity?: number;
  driver_name?: string;
}

interface Employee {
  id: number;
  full_name: string;
  employee_id?: string;
  department?: string;
  location?: string;
}

interface Trip {
  id: number;
  employee_name: string;
  start_location: string;
  end_location: string;
  scheduled_time: string;
  status: string;
  driver_name?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  route_id?: number;
}

interface FormErrors {
  route_name?: string;
  start_location?: string;
  end_location?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  distance?: string;
  estimated_duration?: string;
}

interface MapModal {
  open: boolean;
  route: Route | null;
}

// ── Admin Map Modal (Leaflet-based) ───────────────────────────────
function AdminMapModal({ route, onClose }: { route: Route; onClose: () => void }) {
  const stops = [
    {
      name: 'Start',
      address: route.start_location,
      status: 'in-progress' as const,
    },
    ...(route.waypoints || []).map((wp, i) => ({
      name: `Stop ${i + 1}`,
      address: wp,
      status: 'pending' as const,
    })),
    {
      name: 'End',
      address: route.end_location,
      status: 'pending' as const,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-5xl overflow-hidden flex flex-col animate-in zoom-in duration-300 h-[85vh]">
        {/* Header */}
        <div className="px-8 py-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 rotate-3">
              <MapIcon className="w-6 h-6 text-white -rotate-3" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 tracking-[0.2em] mb-0.5">Live Route Map</p>
              <h3 className="text-xl font-black text-gray-900">{route.route_name}</h3>
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
          <AdminRouteMapUI stops={stops} />
        </div>

        {/* Footer Info */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500">Distance:</span>
              <span className="ml-2 font-bold text-gray-900">{route.distance ? `${route.distance} km` : '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Duration:</span>
              <span className="ml-2 font-bold text-gray-900">{route.estimated_duration ? `${route.estimated_duration} min` : '—'}</span>
            </div>
          </div>
          <Button onClick={onClose} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
            Close Map
          </Button>
        </div>
      </div>
    </div>
  );
}


// ── Route Detail Modal (Stops & OTPs) ──────────────────────────────
function RouteDetailModal({ routeId, onClose }: { routeId: number; onClose: () => void }) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/routes/${routeId}/details`, {
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
        const data = await res.json();
        setDetails(data);
      } catch (err) {
        console.error("Failed to fetch route details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [routeId]);

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 border border-gray-100">
        <div className="px-6 py-5 bg-emerald-600 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Route Stops & OTPs</h3>
            <p className="text-emerald-100 text-xs">Trip verification codes for each employee</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!details?.trips || details.trips.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No employees assigned to this route yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {details.trips.map((trip: any, i: number) => (
                <div key={trip.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors group">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-emerald-600 font-black shrink-0">
                    {trip.sequence_number || (i + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-bold truncate">{trip.employee_name}</p>
                    <p className="text-gray-500 text-xs truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {trip.start_location}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verification OTP</p>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl font-mono text-lg font-black tracking-widest shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      {trip.otp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button onClick={onClose} className="bg-white hover:bg-gray-100 text-gray-700 border-gray-200 rounded-xl px-6">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}


const DEFAULT_FORM = {
  route_name: '',
  start_location: '',
  end_location: '',
  scheduled_date: '',
  scheduled_time_slot: '',
  distance: '',
  estimated_duration: '',
  assigned_driver_id: 'none',
  vehicle_id: 'none',
  max_passengers: '',
  waypoints: [] as string[],
  selected_employees: [] as number[],
};

// ─── Field Helper ───────────────────────────────────────────
const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

export default function RoutesManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('routes');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [waypointInput, setWaypointInput] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [detailModal, setDetailModal] = useState<{ open: boolean; routeId: number | null }>({ open: false, routeId: null });
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    distanceValue: number;
    durationValue: number;
  } | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  const todayStr = new Date().toISOString().split('T')[0];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'users', label: 'Employees', icon: Users, path: '/admin/users' },
    { id: 'drivers', label: 'Drivers', icon: UserCog, path: '/admin/drivers' },
    { id: 'vehicles', label: 'Vehicles', icon: Car, path: '/admin/vehicles' },
    { id: 'routes', label: 'Routes', icon: RouteIcon, path: '/admin/routes' },
    { id: 'trips', label: 'Trips', icon: TrendingUp, path: '/admin/trips' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    fetchAllData();
    fetchActiveAlerts();
    subscribeToAdminTracking();
    
    const cleanupSOS = listenForSOSAlert((alert) => {
      setActiveAlerts(prev => [alert, ...prev]);
    });

    return () => cleanupSOS();
  }, []);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); }
  }, [error]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const tripsData = user?.role === 'employee' ? await tripAPI.getUserTrips() : await tripAPI.getAll();
      const [routesData, driversData, vehiclesData, employeesData] = await Promise.all([
        routesAPI.getAll(),
        driverAPI.getAll(),
        vehicleAPI.getAll(),
        employeeAPI.getAll(),
      ]);
      setRoutes((routesData || []).map((r: any) => ({
        ...r,
        waypoints: typeof r.waypoints === 'string' ? JSON.parse(r.waypoints) : (r.waypoints || [])
      })).filter((r: any) => r.status !== 'completed'));
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setEmployees((employeesData || []).map((e: any) => ({
        id: Number(e.id),
        full_name: String(e.full_name || ''),
        employee_id: String(e.employee_id || ''),
        department: String(e.department || ''),
        location: String(e.location || ''),
      })));
      setTrips(tripsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/emergency/active`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      setActiveAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch active alerts", err);
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.route_name.trim()) errs.route_name = 'Route name is required.';
    if (!formData.start_location.trim()) errs.start_location = 'Pickup point is required.';
    if (!formData.end_location.trim()) errs.end_location = 'Drop-off point is required.';
    if (!formData.scheduled_date) errs.scheduled_date = 'Departure date is required.';
    if (!formData.scheduled_time_slot) errs.scheduled_time = 'Departure time is required.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time_slot}:00`;
      const payload: any = {
        route_name: formData.route_name,
        start_location: formData.start_location,
        end_location: formData.end_location,
        scheduled_time: scheduledDateTime,
        distance: formData.distance ? Number(formData.distance) : undefined,
        estimated_duration: formData.estimated_duration ? Number(formData.estimated_duration) : undefined,
        assigned_driver_id: formData.assigned_driver_id !== 'none' ? Number(formData.assigned_driver_id) : undefined,
        vehicle_id: formData.vehicle_id !== 'none' ? Number(formData.vehicle_id) : undefined,
        waypoints: formData.waypoints,
        employee_ids: formData.selected_employees,
      };

      if (editingId) {
        await routesAPI.update(editingId, payload);
        setSuccess('Route updated.');
      } else {
        await routesAPI.create(payload);
        setSuccess('Route created.');
      }
      resetForm();
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to save route');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...DEFAULT_FORM });
    setFormErrors({});
    setWaypointInput('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (route: Route) => {
    setEditingId(route.id);
    setFormData({
      ...DEFAULT_FORM,
      route_name: route.route_name,
      start_location: route.start_location,
      end_location: route.end_location,
      distance: route.distance?.toString() || '',
      estimated_duration: route.estimated_duration?.toString() || '',
      waypoints: route.waypoints || [],
    });
    setShowForm(true);
    setTimeout(() => document.getElementById('route-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this route?')) return;
    try {
      await routesAPI.delete(id);
      setRoutes(routes.filter(r => r.id !== id));
      setSuccess('Route deleted.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete route');
    }
  };

  const addWaypoint = () => {
    const val = waypointInput.trim();
    if (val && !formData.waypoints.includes(val)) {
      setFormData(prev => ({ ...prev, waypoints: [...prev.waypoints, val] }));
      setWaypointInput('');
    }
  };

  const removeWaypoint = (idx: number) => {
    setFormData(prev => ({ ...prev, waypoints: prev.waypoints.filter((_, i) => i !== idx) }));
  };

  useEffect(() => {
    if (routes.length > 0 && !selectedRoute) {
      setSelectedRoute(routes[0]);
    }
  }, [routes, selectedRoute]);

  useEffect(() => {
    setRouteInfo(null);
  }, [selectedRoute?.id]);

  useEffect(() => {
    if (!activeAlerts.length) return;

    const latestRouteAlert = activeAlerts.find((alert) => {
      const trip = trips.find((item) => item.id === Number(alert.trip_id));
      return Boolean(trip?.route_id);
    });

    if (!latestRouteAlert) return;

    const matchingTrip = trips.find((trip) => trip.id === Number(latestRouteAlert.trip_id));
    const matchingRoute = routes.find((route) => route.id === matchingTrip?.route_id);

    if (matchingRoute && matchingRoute.id !== selectedRoute?.id) {
      setSelectedRoute(matchingRoute);
    }
  }, [activeAlerts, trips, routes, selectedRoute]);

  const selectedRouteStops = selectedRoute ? (selectedRoute.waypoints?.length || 0) + 2 : 0;
  const selectedRouteAssignments = [selectedRoute?.driver_name, selectedRoute?.vehicle_number].filter(Boolean).length;
  const selectedRouteStatus = selectedRoute?.status
    ? selectedRoute.status.charAt(0).toUpperCase() + selectedRoute.status.slice(1)
    : 'Not selected';
  const selectedRouteAlert = selectedRoute
    ? activeAlerts.find((alert) => trips.find((trip) => trip.id === Number(alert.trip_id))?.route_id === selectedRoute.id)
    : null;
  const selectedEmergencyLocation = selectedRouteAlert
    ? { lat: Number(selectedRouteAlert.latitude), lng: Number(selectedRouteAlert.longitude) }
    : undefined;
  const selectedAlertUpdatedAt = selectedRouteAlert?.created_at
    ? new Date(selectedRouteAlert.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;
  const visibleDistance = routeInfo?.distance || (selectedRoute?.distance ? `${selectedRoute.distance} km` : '—');
  const visibleDuration = routeInfo?.duration || (selectedRoute?.estimated_duration ? `${selectedRoute.estimated_duration} min` : '—');

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf9_0%,#eff7f4_42%,#f9fbfb_100%)] flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-emerald-700 to-teal-700 text-white w-64 transform transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 shadow-2xl`}
      >
        <div className="p-6 border-b border-emerald-600">
          <TranzoLogo size="medium" showText={true} />
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveMenu(item.id); navigate(item.path); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeMenu === item.id ? 'bg-white text-emerald-700 shadow-lg' : 'text-emerald-100 hover:bg-emerald-600'
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
                <p className="text-white font-medium text-sm">{user?.full_name || 'Admin'}</p>
                <p className="text-emerald-200 text-xs">{user?.email || 'admin@company.com'}</p>
              </div>
            </div>
          </div>
          <Button onClick={handleLogout} className="w-full flex items-center gap-3 bg-red-500 hover:bg-red-600 rounded-xl">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen p-6 relative">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
           <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-600">
             {sidebarOpen ? <X /> : <Menu />}
           </Button>
           <h1 className="text-2xl font-semibold text-gray-800">Map Page</h1>
        </div>

        <div className="max-w-[1600px] mx-auto">
            {/* Page Header Actions */}
            <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                    setTimeout(() => document.getElementById('route-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="h-12 rounded-2xl bg-emerald-600 px-5 text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Route
                </Button>
              </div>
            </div>

            {/* Notifications */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-5 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
              </div>
            )}

            {/* FORM SECTION */}
            {showForm && (
              <div id="route-form">
                <Card className="p-0 mb-8 bg-white rounded-2xl border border-emerald-100 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <RouteIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-white font-semibold text-lg">{editingId ? 'Edit Route' : 'Create New Route'}</h2>
                        <p className="text-emerald-100 text-xs">Configure tactical transport vectors</p>
                      </div>
                    </div>
                    <button onClick={resetForm} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    <section>
                      <h3 className="text-sm font-semibold text-emerald-700 tracking-wider mb-4 flex items-center gap-2">
                        <Navigation className="w-4 h-4" /> Route Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-gray-700">
                        <div className="md:col-span-2">
                          <Field label="Route Name *" error={formErrors.route_name}>
                            <Input
                              placeholder="e.g. Morning Express"
                              value={formData.route_name}
                              onChange={e => setFormData(p => ({ ...p, route_name: e.target.value }))}
                              className="rounded-xl"
                            />
                          </Field>
                        </div>
                        <Field label="Pickup Point *" error={formErrors.start_location}>
                          <Input
                            placeholder="Pickup location"
                            value={formData.start_location}
                            onChange={e => setFormData(p => ({ ...p, start_location: e.target.value }))}
                            className="rounded-xl"
                          />
                        </Field>
                        <Field label="Drop-off Point *" error={formErrors.end_location}>
                          <Input
                            placeholder="Drop-off location"
                            value={formData.end_location}
                            onChange={e => setFormData(p => ({ ...p, end_location: e.target.value }))}
                            className="rounded-xl"
                          />
                        </Field>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-semibold text-emerald-700 tracking-wider mb-4 flex items-center gap-2">
                        <Milestone className="w-4 h-4" /> Intermediate Stops
                      </h3>
                      <div className="flex gap-2 mb-3">
                        <Input
                          placeholder="Add stop"
                          value={waypointInput}
                          onChange={e => setWaypointInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addWaypoint(); } }}
                          className="rounded-xl flex-1"
                        />
                        <Button type="button" onClick={addWaypoint} variant="outline" className="rounded-xl">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.waypoints.map((wp, i) => (
                          <span key={i} className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            {wp} <X size={10} className="cursor-pointer" onClick={() => removeWaypoint(i)} />
                          </span>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-semibold text-emerald-700 tracking-wider mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Schedule
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-gray-700">
                        <Field label="Date *" error={formErrors.scheduled_date}>
                          <Input
                            type="date"
                            min={todayStr}
                            value={formData.scheduled_date}
                            onChange={e => setFormData(p => ({ ...p, scheduled_date: e.target.value }))}
                            className="rounded-xl"
                          />
                        </Field>
                        <Field label="Time *" error={formErrors.scheduled_time}>
                          <Input
                            type="time"
                            value={formData.scheduled_time_slot}
                            onChange={e => setFormData(p => ({ ...p, scheduled_time_slot: e.target.value }))}
                            className="rounded-xl"
                          />
                        </Field>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-semibold text-emerald-700 tracking-wider mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Assignments
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-gray-700">
                        <Field label="Driver">
                          <Select value={formData.assigned_driver_id} onValueChange={(v: string) => setFormData(p => ({ ...p, assigned_driver_id: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select Driver" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Auto-assign later</SelectItem>
                              {drivers.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.full_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Vehicle">
                          <Select value={formData.vehicle_id} onValueChange={(v: string) => setFormData(p => ({ ...p, vehicle_id: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Auto-assign later</SelectItem>
                              {vehicles.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.vehicle_number}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                    </section>

                    <div className="flex justify-end pt-6 border-t font-semibold">
                       <Button type="button" variant="ghost" onClick={resetForm} className="mr-3 rounded-xl">Cancel</Button>
                       <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-12">
                          {submitting ? 'Processing...' : (editingId ? 'Update Route' : 'Create Route')}
                       </Button>
                    </div>
                  </form>
                </Card>
              </div>
            )}

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: Routes & Trips */}
                <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.5)] backdrop-blur flex flex-col min-h-[680px]">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Trip Details</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-600">Available</p>
                      <p className="text-lg font-semibold text-emerald-900">{routes.length}</p>
                    </div>
                  </div>
                  
                  {/* SOS ALERTS */}
                  {activeAlerts.length > 0 && (
                    <div className="mb-6 space-y-3">
                      {activeAlerts.map(alert => (
                        <div key={alert.id} className="rounded-2xl border border-red-100 bg-[linear-gradient(135deg,#fff5f5_0%,#fff1f2_100%)] p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200"><AlertCircle /></div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700">Emergency SOS</p>
                              <p className="mt-1 text-sm font-semibold text-red-950">{alert.user_name}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const matchingTrip = trips.find((trip) => trip.id === Number(alert.trip_id));
                              const matchingRoute = routes.find((route) => route.id === matchingTrip?.route_id);
                              if (matchingRoute) {
                                setSelectedRoute(matchingRoute);
                              }
                            }}
                          >
                            Track
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto max-h-[calc(100vh-400px)] space-y-3 custom-scrollbar">
                    {routes.map(route => (
                      <div 
                        key={route.id}
                        onClick={() => setSelectedRoute(route)}
                        className={`cursor-pointer rounded-[24px] border p-5 transition-all ${selectedRoute?.id === route.id ? 'border-emerald-300 bg-emerald-50/70 shadow-[0_18px_40px_-30px_rgba(5,150,105,0.9)]' : 'border-slate-100 bg-slate-50/40 hover:border-emerald-100 hover:bg-white'}`}
                      >
                        <div className="mb-4 flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <div className="mb-2 flex items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${route.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {route.status ? route.status.charAt(0).toUpperCase() + route.status.slice(1) : 'Pending'}
                              </span>
                              {(route.waypoints?.length || 0) > 0 && (
                                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                  {route.waypoints?.length} stop{route.waypoints?.length === 1 ? '' : 's'}
                                </span>
                              )}
                            </div>
                            <h3 className="truncate pr-4 text-lg font-semibold tracking-tight text-slate-900">{route.route_name}</h3>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(route); }} className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-emerald-600"><Edit size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(route.id); }} className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <div className="hidden">
                          <MapPin size={10} className="text-emerald-500" />
                          {route.start_location.split(',')[0]} → {route.end_location.split(',')[0]}
                        </div>
                        <div className="mb-4 flex items-start gap-2 text-sm text-slate-600">
                          <MapPin size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">{route.start_location.split(',')[0]} to {route.end_location.split(',')[0]}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{route.start_location} - {route.end_location}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="rounded-2xl bg-white/90 px-3 py-2">
                            <p className="text-[11px] font-medium text-slate-500">Distance</p>
                            <p className="mt-1 font-semibold text-slate-900">{route.distance || 0} km</p>
                          </div>
                          <div className="rounded-2xl bg-white/90 px-3 py-2">
                            <p className="text-[11px] font-medium text-slate-500">Duration</p>
                            <p className="mt-1 font-semibold text-slate-900">{route.estimated_duration || 0} min</p>
                          </div>
                          <div className="rounded-2xl bg-white/90 px-3 py-2">
                            <p className="text-[11px] font-medium text-slate-500">Assigned</p>
                            <p className="mt-1 font-semibold text-slate-900">{route.driver_name || route.vehicle_number ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {routes.length === 0 && (
                      <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                          <RouteIcon className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">No routes available yet</h3>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Create a new route to start assigning drivers, vehicles, and multi-stop journeys from this panel.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Live Map */}
                <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.5)] backdrop-blur flex flex-col min-h-[680px]">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Live Tracking</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Tracking active</span>
                  </div>
                  <div className="flex-1 rounded-[28px] overflow-hidden bg-slate-50 border border-slate-100 relative min-h-[420px] shadow-inner">
                    {selectedRoute ? (
                      <AdminRouteMapUI 
                        stops={[
                          {
                            name: 'Origin',
                            address: selectedRoute.start_location,
                            lat: selectedRoute.start_lat ?? undefined,
                            lng: selectedRoute.start_lng ?? undefined,
                          },
                          ...(selectedRoute.waypoints || [])
                            .filter((w: string) => w.trim() !== '')
                            .map((w: string, i: number) => ({ name: `Stop ${i+1}`, address: w })),
                          {
                            name: 'Destination',
                            address: selectedRoute.end_location,
                            lat: selectedRoute.end_lat ?? undefined,
                            lng: selectedRoute.end_lng ?? undefined,
                          }
                        ]}
                        emergencyLocation={selectedEmergencyLocation}
                        onRouteInfo={setRouteInfo}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                         <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-emerald-600 shadow-sm"><MapIcon className="h-7 w-7" /></div>
                         <p className="text-lg font-semibold text-slate-900">Select a route to preview it on the map</p>
                         <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">The selected route will show start and end markers, intermediate stops, and any active SOS location.</p>
                      </div>
                    )}
                  </div>

                  {selectedRoute && (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {selectedRouteStatus}
                              </span>
                              {selectedRouteAlert && (
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                  SOS Active
                                </span>
                              )}
                            </div>
                            <p className="mt-3 text-lg font-semibold text-slate-900">{selectedRoute.route_name}</p>
                            <p className="mt-2 text-sm text-slate-600">
                              {selectedRoute.start_location.split(',')[0]} to {selectedRoute.end_location.split(',')[0]}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {selectedRoute.driver_name || 'Driver not assigned'} {selectedRoute.vehicle_number ? `- ${selectedRoute.vehicle_number}` : ''}
                            </p>
                          </div>
                          <div className="grid min-w-[220px] grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <p className="text-xs font-medium text-slate-500">Distance</p>
                              <p className="mt-1 text-2xl font-semibold text-slate-900">{visibleDistance}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <p className="text-xs font-medium text-slate-500">Duration</p>
                              <p className="mt-1 text-2xl font-semibold text-slate-900">{visibleDuration}</p>
                            </div>
                          </div>
                        </div>

                        {selectedRouteAlert && selectedEmergencyLocation && (
                          <div className="mt-4 rounded-[22px] border border-red-100 bg-[linear-gradient(135deg,#fff7f7_0%,#fff3f4_100%)] p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Emergency location</p>
                                <p className="mt-1 text-sm font-semibold text-red-900">
                                  {selectedRouteAlert.userName || selectedRouteAlert.user_name || 'Employee alert'}
                                </p>
                                <p className="mt-1 text-sm text-red-700">
                                  {selectedEmergencyLocation.lat.toFixed(6)}, {selectedEmergencyLocation.lng.toFixed(6)}
                                </p>
                              </div>
                              <div className="text-sm text-red-700">
                                Last updated {selectedAlertUpdatedAt || 'just now'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 rounded-[24px] border border-slate-100 bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{selectedRouteStops} stops</p>
                          <p className="mt-1 text-sm text-slate-500">{selectedRouteAssignments} assignment{selectedRouteAssignments === 1 ? '' : 's'}</p>
                        </div>
                        <Button onClick={() => setDetailModal({ open: true, routeId: selectedRoute.id })} size="sm" variant="outline" className="rounded-xl border-emerald-200 px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                          Verify Codes
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
            </div>
        </div>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Detail Modal */}
      {detailModal.open && detailModal.routeId && (
        <RouteDetailModal
          routeId={detailModal.routeId}
          onClose={() => setDetailModal({ open: false, routeId: null })}
        />
      )}
    </div>
  );
}
