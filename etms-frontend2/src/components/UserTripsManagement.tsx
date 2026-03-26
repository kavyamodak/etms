import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Map,
  MessageSquare,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Car,
  Calendar,
  Edit,
  Trash2,
  Radio,
  Wifi,
  Navigation,
  Flag,
  Lock as LockIcon,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import TranzoLogo from './TranzoLogo';
import { getSocket } from '../services/socket';
import GoogleMap from './GoogleMap';

interface Trip {
  id: number;
  employee_name: string;
  driver_name?: string;
  driver_id?: number;
  vehicle_number?: string;
  start_location: string;
  end_location: string;
  scheduled_time: string;
  status: string;
  cost?: number;
  created_at: string;
}

export default function UserTripsManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('trips');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    start_location: '',
    end_location: '',
    scheduled_time: '',
  });

  const [mapModal, setMapModal] = useState<{ open: boolean; trip: Trip | null }>({
    open: false,
    trip: null,
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/user' },
    { id: 'trips', label: 'My Trips', icon: MapPin, path: '/user/trips' },
    { id: 'request', label: 'Request Trip', icon: PlusCircle, path: '/user/request' },
    { id: 'maps', label: 'Maps', icon: Map, path: '/user/maps' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/user/feedback' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Fetch user trips on mount
  useEffect(() => {
    fetchUserTrips();
  }, []);

  const fetchUserTrips = async () => {
    setLoading(true);
    try {
      const tripsData = await tripAPI.getUserTrips();
      setTrips(tripsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your trips');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.start_location || !formData.end_location || !formData.scheduled_time) {
      setError('Start location, end location, and scheduled time are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        start_location: formData.start_location,
        end_location: formData.end_location,
        scheduled_time: formData.scheduled_time,
      };

      const newTrip = await tripAPI.requestTrip(payload);
      setTrips([newTrip, ...trips]);

      setFormData({
        start_location: '',
        end_location: '',
        scheduled_time: '',
      });
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to request trip');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingId(trip.id);
    setFormData({
      start_location: trip.start_location,
      end_location: trip.end_location,
      scheduled_time: trip.scheduled_time,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;

    try {
      await tripAPI.delete(id);
      setTrips(trips.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to cancel trip');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-orange-100 text-orange-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDisplayStatus = (trip: Trip) => {
    return trip.status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
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
                onClick={() => {
                  setActiveMenu(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeMenu === item.id
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
          {/* User Profile Section */}
          <div
            className="bg-emerald-600 rounded-xl p-3 cursor-pointer hover:bg-emerald-500 transition-colors"
            onClick={() => navigate('/profile')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{user?.full_name || 'User'}</p>
                <p className="text-emerald-200 text-xs">
                  {user?.email || 'employee@company.com'}
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 bg-red-500 hover:bg-red-600 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X /> : <Menu />}
              </Button>
              <div>
                <h1 className="text-gray-800">My Trips</h1>
                <p className="text-gray-500 text-sm">Manage your transportation requests</p>
              </div>
            </div>
            {!showForm && (
              <Button
                onClick={() => navigate('/user/request')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
              >
                Request Trip
              </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">

            {error && (
              <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-xl">
                {error}
              </div>
            )}

            {/* Request Form */}
            {showForm && (
              <Card className="p-6 mb-6 bg-white rounded-2xl border-none shadow-lg">
                <h2 className="text-gray-900 mb-4">{editingId ? 'Edit Trip' : 'Request New Trip'}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Input
                    placeholder="Start Location"
                    value={formData.start_location}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, start_location: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                  <Input
                    placeholder="End Location"
                    value={formData.end_location}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, end_location: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    className="rounded-xl"
                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingId ? 'Update Trip' : 'Request Trip'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* Trips List */}
            {loading && !showForm ? (
              <Card className="p-8 bg-white rounded-2xl border-none text-center">
                <p className="text-gray-500">Loading your trips...</p>
              </Card>
            ) : trips.length === 0 ? (
              <Card className="p-8 bg-white rounded-2xl border-none text-center">
                <p className="text-gray-500">No trips found</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {trips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="p-4 bg-white rounded-2xl border-none hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/user/transport-details/${trip.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center ${trip.status === 'completed'
                        ? 'from-green-100 to-green-200'
                        : trip.status === 'in_progress'
                          ? 'from-blue-100 to-blue-200'
                          : trip.status === 'cancelled'
                            ? 'from-red-100 to-red-200'
                            : 'from-orange-100 to-orange-200'
                        }`}>
                        <UserIcon className={`w-5 h-5 ${trip.status === 'completed'
                          ? 'text-green-600'
                          : trip.status === 'in_progress'
                            ? 'text-blue-600'
                            : trip.status === 'cancelled'
                              ? 'text-red-600'
                              : 'text-orange-600'
                          }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 mb-2 font-semibold">{trip.employee_name}</h3>
                        <div className="space-y-2 text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{trip.start_location} → {trip.end_location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(trip.scheduled_time).toLocaleString()}</span>
                          </div>
                          {trip.driver_name && (
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4" />
                              <span>Driver: {trip.driver_name}</span>
                            </div>
                          )}
                          {trip.vehicle_number && (
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4" />
                              <span>Vehicle: {trip.vehicle_number}</span>
                            </div>
                          )}
                          {trip.cost && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Cost: ₹{trip.cost}</span>
                            </div>
                          )}
                          {trip.status === 'scheduled' && (trip as any).otp && (
                            <div className="mt-3 bg-emerald-50 rounded-xl p-3 flex items-center justify-between border border-emerald-100">
                                <div className="flex items-center gap-2">
                                    <LockIcon className="w-4 h-4 text-emerald-600" />
                                    <span className="text-[10px] font-black uppercase text-emerald-600">Auth Code</span>
                                </div>
                                <span className="font-mono font-black text-emerald-700 tracking-widest">{(trip as any).otp}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          {(() => {
                            const displayStatus = getDisplayStatus(trip);
                            return (
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  displayStatus
                                )}`}
                              >
                                {displayStatus.replace('_', ' ').toUpperCase()}
                              </span>
                            );
                          })()}
                          
                            <Button 
                              size="sm"
                              variant="ghost"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold p-0 h-auto gap-2"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                navigate('/user/maps');
                              }}
                            >
                              <Radio className="w-4 h-4 animate-pulse" />
                              Track Live
                            </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Map Modal */}
      {mapModal.open && mapModal.trip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl h-[80vh] bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Live Trip Tracking</h3>
                <p className="text-xs text-gray-500">
                  {mapModal.trip.start_location} → {mapModal.trip.end_location}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMapModal({ open: false, trip: null })}
                className="rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 h-[calc(100%-5rem)]">
              <GoogleMap 
                origin={mapModal.trip.start_location}
                destination={mapModal.trip.end_location}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
