import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { routesAPI, driverAPI, vehicleAPI, tripAPI, employeeAPI } from '../services/api';
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

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api'}/admin/routes/${routeId}/details`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

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
      const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api'}/emergency/active`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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

  return (
    <div className="min-h-screen bg-white flex">
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
      <main className="flex-1 lg:ml-64 bg-[#f4f7f6] min-h-screen p-6 relative">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
           <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-600">
             {sidebarOpen ? <X /> : <Menu />}
           </Button>
           <h1 className="text-2xl font-semibold text-gray-700">Route Management</h1>
        </div>

        <div className="max-w-[1600px] mx-auto">
            {/* Page Header Actions */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm italic">Synchronizing tactical route intelligence...</p>
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                  setTimeout(() => document.getElementById('route-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Route
              </Button>
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
                <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col min-h-[600px] border border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">Tactical Feed</h2>
                  
                  {/* SOS ALERTS */}
                  {activeAlerts.length > 0 && (
                    <div className="mb-6 space-y-3">
                      {activeAlerts.map(alert => (
                        <div key={alert.id} className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white"><AlertCircle /></div>
                            <div>
                              <p className="font-bold text-red-900 text-xs">EMERGENCY SOS</p>
                              <p className="text-red-700 text-xs font-semibold">{alert.user_name}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 bg-white" onClick={() => setSelectedRoute(null)}>TRACK</Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto max-h-[calc(100vh-400px)] space-y-3 custom-scrollbar">
                    {routes.map(route => (
                      <div 
                        key={route.id}
                        onClick={() => setSelectedRoute(route)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedRoute?.id === route.id ? 'border-emerald-500 bg-emerald-50/20 shadow-sm' : 'border-gray-50 hover:border-emerald-100'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900 text-sm uppercase truncate pr-4">{route.route_name}</h3>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(route); }} className="p-1 hover:bg-gray-100 rounded text-gray-400"><Edit size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(route.id); }} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-2">
                          <MapPin size={10} className="text-emerald-500" />
                          {route.start_location.split(',')[0]} → {route.end_location.split(',')[0]}
                        </div>
                        <div className="flex gap-4 text-[10px] font-black text-gray-400">
                          <span>{route.distance || 0} KM</span>
                          <span>{route.estimated_duration || 0} MIN</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Live Map */}
                <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col min-h-[600px] border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Live Tracking</h2>
                    <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-0.5 font-black rounded-full uppercase italic">Uplink Active</span>
                  </div>
                  <div className="flex-1 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative min-h-[400px]">
                    {selectedRoute ? (
                      <AdminRouteMapUI 
                        stops={[
                          { name: 'Origin', address: selectedRoute.start_location },
                          ...(selectedRoute.waypoints || [])
                            .filter((w: string) => w.trim() !== '')
                            .map((w: string, i: number) => ({ name: `Stop ${i+1}`, address: w })),
                          { name: 'Destination', address: selectedRoute.end_location }
                        ]}
                        emergencyLocation={activeAlerts.length > 0 ? { lat: Number(activeAlerts[0].latitude), lng: Number(activeAlerts[0].longitude) } : undefined}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                         <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-4"><MapIcon className="text-white" /></div>
                         <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Select objective to initiate tracking</p>
                      </div>
                    )}
                  </div>

                  {selectedRoute && (
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div className="text-gray-900 font-bold text-xs">
                        {selectedRoute.route_name}
                      </div>
                      <Button onClick={() => setDetailModal({ open: true, routeId: selectedRoute.id })} size="sm" variant="outline" className="text-[10px] font-black rounded-lg">VERIFY CODES</Button>
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
