import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripAPI, employeeAPI, driverAPI, vehicleAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, Calendar, MapPin, Users, Car, User, Menu, X, Plus, TrendingUp, CreditCard, FileText, LogOut, UserCog, LayoutDashboard, Route as RouteIcon, Edit, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import TranzoLogo from './TranzoLogo';

interface Trip {
  id: number;
  employee_name: string;
  driver_name?: string;
  driver_id?: number;
  vehicle_number?: string;
  vehicle_id?: number;
  start_location: string;
  end_location: string;
  scheduled_time: string;
  status: string;
  cost?: number;
  created_at: string;
}

interface Employee {
  id: number;
  user_id: number;
  employee_id: string;
}

interface Driver {
  id: number;
  user_id: number;
  full_name: string;
}

interface Vehicle {
  id: number;
  vehicle_number: string;
}

export default function TripsManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('trips');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const [formData, setFormData] = useState({
    employee_id: '',
    start_location: '',
    end_location: '',
    scheduled_time: '',
    driver_id: '',
    vehicle_id: '',
    status: 'scheduled',
  });

  const getDisplayStatus = (trip: Trip) => {
    return trip.status;
  };

  const isDriverBusyForTime = (driver: Driver, scheduledTimeISO: string, allTrips: Trip[]) => {
    return allTrips.some((trip) => {
      const matchesDriver =
        (trip.driver_id && trip.driver_id === driver.id) ||
        (!!trip.driver_name && trip.driver_name === driver.full_name);

      if (!matchesDriver) return false;

      // Block driver for any non-completed / non-cancelled trip
      if (trip.status === 'completed' || trip.status === 'cancelled') return false;
      return true;
    });
  };

  const getAvailableDriversForTime = (scheduledTimeISO: string) => {
    if (!scheduledTimeISO) return drivers;
    return drivers.filter((driver) => !isDriverBusyForTime(driver, scheduledTimeISO, trips));
  };

  const pickBestDriverForTime = (scheduledTimeISO: string): Driver | undefined => {
    const available = getAvailableDriversForTime(scheduledTimeISO);
    if (available.length === 0) return undefined;

    // Prefer driver with fewest active trips, then earliest last trip time
    const activeStatuses = new Set(['scheduled', 'in_progress']);
    const scored = available.map((driver) => {
      const driverTrips = trips.filter(
        (trip) =>
          ((trip.driver_id && trip.driver_id === driver.id) ||
            (!!trip.driver_name && trip.driver_name === driver.full_name)) &&
          activeStatuses.has(trip.status)
      );

      const activeCount = driverTrips.length;
      const lastTime =
        driverTrips.length === 0
          ? 0
          : Math.max(
            ...driverTrips
              .map((t) => new Date(t.scheduled_time).getTime())
              .filter((t) => !Number.isNaN(t))
          );

      return { driver, activeCount, lastTime };
    });

    scored.sort((a, b) => {
      if (a.activeCount !== b.activeCount) return a.activeCount - b.activeCount;
      return a.lastTime - b.lastTime;
    });

    return scored[0]?.driver;
  };

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      let tripsData;

      // Fetch trips based on user role
      if (user?.role === 'employee') {
        // For employees, fetch only their trips
        tripsData = await tripAPI.getUserTrips();
      } else {
        // For admins, fetch all trips
        tripsData = await tripAPI.getAll();
      }

      const [employeesData, driversData, vehiclesData] = await Promise.all([
        employeeAPI.getAll(),
        driverAPI.getAll(),
        vehicleAPI.getAll(),
      ]);

      setTrips(tripsData);
      setEmployees(employeesData);
      if (!user || user.role !== 'admin') {
        setDrivers(driversData);
      }
      setVehicles(vehiclesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.employee_id || !formData.start_location || !formData.end_location || !formData.scheduled_time) {
      setError('Employee, start location, end location, and scheduled time are required');
      return;
    }

    if (new Date(formData.scheduled_time).getTime() < Date.now() && !editingId) {
      setError('You cannot select a past date and time for a new trip.');
      return;
    }

    setLoading(true);
    try {
      let driverIdToUse = formData.driver_id ? Number(formData.driver_id) : undefined;

      // Auto-assign a driver if admin hasn't picked one and a driver is available
      if (!driverIdToUse && user?.role === 'admin' && formData.scheduled_time) {
        const bestDriver = pickBestDriverForTime(formData.scheduled_time);
        if (!bestDriver) {
          setError(
            `No available drivers for the selected time. Please choose a different time slot.`
          );
          setLoading(false);
          return;
        }
        driverIdToUse = bestDriver.id;
      }

      const payload = {
        employee_id: Number(formData.employee_id),
        start_location: formData.start_location,
        end_location: formData.end_location,
        scheduled_time: formData.scheduled_time,
        ...(driverIdToUse && { driver_id: driverIdToUse }),
        ...(formData.vehicle_id && { vehicle_id: Number(formData.vehicle_id) }),
        ...(editingId && { status: formData.status }),
      };

      if (editingId) {
        const existingTrip = trips.find((t) => t.id === editingId);

        await tripAPI.updateStatus(editingId, formData.status);

        // Update driver status based on new trip status
        if (existingTrip?.driver_id) {
          if (formData.status === 'completed' || formData.status === 'cancelled') {
            await driverAPI.updateStatus(existingTrip.driver_id, 'active');
          } else {
            await driverAPI.updateStatus(existingTrip.driver_id, 'inactive');
          }
        }

        // Refresh trips from backend
        const updatedTrips = await tripAPI.getAll();
        setTrips(updatedTrips);
      } else {
        const newTrip = await tripAPI.requestTrip(payload);
        setTrips([newTrip, ...trips]);

        // Mark assigned driver as inactive
        if (driverIdToUse) {
          await driverAPI.updateStatus(driverIdToUse, 'inactive');
        }
      }

      setFormData({
        employee_id: '',
        start_location: '',
        end_location: '',
        scheduled_time: '',
        driver_id: '',
        vehicle_id: '',
        status: 'scheduled',
      });
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save trip');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingId(trip.id);
    setFormData({
      employee_id: '',
      start_location: trip.start_location,
      end_location: trip.end_location,
      scheduled_time: trip.scheduled_time,
      driver_id: '',
      vehicle_id: '',
      status: trip.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    setError('');
    setLoading(true);
    try {
      const tripToDelete = trips.find((t) => t.id === id);
      await tripAPI.delete(id);
      setTrips(trips.filter((t) => t.id !== id));

      // If a driver was assigned, mark them active again
      if (tripToDelete?.driver_id) {
        await driverAPI.updateStatus(tripToDelete.driver_id, 'active');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete trip');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
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
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <TranzoLogo size="small" showText={false} />
        </div>

        {/* Desktop Content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-gray-900 mb-2">Trip Management</h1>
                  <p className="text-gray-600">Manage and monitor all trips</p>
                </div>
                {/* Create New Trip Button Removed */}
              </div>
            </div>
            {/* Create Trip Button for Admin Removed */}
          </div>

          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-xl">
                {error}
              </div>
            )}

            {/* Create/Edit Form */}
            {showForm && (
              <Card className="p-6 mb-6 bg-white rounded-2xl border-none shadow-lg">
                <h2 className="text-gray-900 mb-4">{editingId ? 'Edit Trip' : 'Request Trip'}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {user?.role === 'admin' && (
                    <Select
                      value={formData.employee_id}
                      onValueChange={(value: string) => setFormData({ ...formData, employee_id: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select Employee</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.employee_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Input
                    placeholder="Start Location"
                    value={formData.start_location}
                    onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                  <Input
                    placeholder="End Location"
                    value={formData.end_location}
                    onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_time}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => {
                        const next = { ...prev, scheduled_time: value };
                        // Clear selected driver if they are no longer available for the new time
                        if (
                          next.driver_id &&
                          drivers.length > 0
                        ) {
                          const selectedDriver = drivers.find(
                            (d) => d.id.toString() === next.driver_id
                          );
                          if (
                            selectedDriver &&
                            isDriverBusyForTime(selectedDriver, value, trips)
                          ) {
                            next.driver_id = '';
                          }
                        }
                        return next;
                      });
                    }}
                    className="rounded-xl"
                    required
                  />

                  {user?.role === 'admin' && (
                    <>
                      <Select
                        value={formData.driver_id}
                        onValueChange={(value: string) => setFormData({ ...formData, driver_id: value })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Assign Driver (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Assign Driver (Optional)</SelectItem>
                          {getAvailableDriversForTime(formData.scheduled_time).map((driver) => (
                            <SelectItem key={driver.id} value={driver.id.toString()}>
                              {driver.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={formData.vehicle_id}
                        onValueChange={(value: string) => setFormData({ ...formData, vehicle_id: value })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select Vehicle (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Select Vehicle (Optional)</SelectItem>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                              {vehicle.vehicle_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}

                  {editingId && (
                    <Select
                      value={formData.status}
                      onValueChange={(value: string) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
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
                <p className="text-gray-500">Loading trips...</p>
              </Card>
            ) : trips.length === 0 ? (
              <Card className="p-8 bg-white rounded-2xl border-none text-center">
                <p className="text-gray-500">No trips found</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {trips.map((trip) => (
                  <Card key={trip.id} className="p-4 bg-white rounded-2xl border-none hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center ${trip.status === 'completed'
                        ? 'from-green-100 to-green-200'
                        : trip.status === 'in_progress'
                          ? 'from-blue-100 to-blue-200'
                          : trip.status === 'cancelled'
                            ? 'from-red-100 to-red-200'
                            : 'from-orange-100 to-orange-200'
                        }`}>
                        <User className={`w-5 h-5 ${trip.status === 'completed'
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
                              <User className="w-4 h-4" />
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
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          {(() => {
                            const displayStatus = getDisplayStatus(trip);
                            return (
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${displayStatus === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : displayStatus === 'in_progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : displayStatus === 'cancelled'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}
                              >
                                {displayStatus.replace('_', ' ').toUpperCase()}
                              </span>
                            );
                          })()}
                          {user?.role === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(trip)}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
