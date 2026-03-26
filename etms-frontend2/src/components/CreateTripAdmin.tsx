import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  Route,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  X,
  UserCog,
  Bus,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useNotify } from '../context/NotificationContext';

import { employeeAPI, driverAPI, vehicleAPI, tripAPI } from '../services/api';

export default function CreateTripAdmin() {
  const navigate = useNavigate();
  const notify = useNotify();
  const [activeMenu, setActiveMenu] = useState('createtrip');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [employeeFields, setEmployeeFields] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    driverName: '',
    pickupLocation: '',
    dropLocation: '',
    date: '',
    time: '',
    tripType: '',
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'users', label: 'Employees', icon: Users, path: '/admin/users' },
    { id: 'drivers', label: 'Drivers', icon: UserCog, path: '/admin/drivers' },
    { id: 'vehicles', label: 'Vehicles', icon: Car, path: '/admin/vehicles' },
    { id: 'routes', label: 'Routes', icon: Route, path: '/admin/routes' },
    { id: 'createtrip', label: 'Create Trip', icon: Plus, path: '/admin/createtrip' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
  ];

  useEffect(() => {
    let mounted = true;
    Promise.all([vehicleAPI.getAll(), driverAPI.getAll(), employeeAPI.getAll()])
      .then(([vRes, dRes, eRes]) => {
        if (!mounted) return;
        setVehicles(vRes.filter((v:any) => v.status === 'active' || v.status === 'available'));
        setDrivers(dRes.filter((d:any) => d.status === 'active' || d.status === 'available'));
        setEmployees(eRes);
        setLoading(false);
      })
      .catch(err => {
        if (mounted) setLoading(false);
        notify.error('Failed to load required data');
      });
    return () => { mounted = false; };
  }, [notify]);

  useEffect(() => {
    if (selectedVehicle) {
      setEmployeeFields(Array(selectedVehicle.capacity).fill(''));
    }
  }, [selectedVehicle]);

  const handleVehicleChange = (vehicleNumber: string) => {
    const vehicle = vehicles.find(v => v.vehicle_number === vehicleNumber);
    setSelectedVehicle(vehicle || null);
    setFormData({ ...formData, vehicleNumber });
  };

  const handleEmployeeChange = (index: number, value: string) => {
    const newFields = [...employeeFields];
    newFields[index] = value;
    setEmployeeFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filledEmployees = employeeFields.filter(emp => emp.trim() !== '');
    
    if (filledEmployees.length === 0) {
      notify.warning('Please add at least one employee before creating the trip.');
      return;
    }

    if (!selectedVehicle) {
      notify.warning('Please select a vehicle');
      return;
    }

    if (!formData.driverName) {
      notify.warning('Please select a driver');
      return;
    }

    try {
      await tripAPI.createAdminRoute({
         vehicle_number: selectedVehicle.vehicle_number,
         driver_id: parseInt(formData.driverName, 10),
         start_location: formData.pickupLocation,
         end_location: formData.dropLocation,
         scheduled_time: `${formData.date}T${formData.time}:00`,
         employee_ids: filledEmployees.map(id => parseInt(id, 10))
      });

      notify.success(`Trip created successfully! ${filledEmployees.length} employee(s) added.`);
      navigate('/admin/routes');
    } catch (err: any) {
      notify.error(err.message || 'Failed to create trip');
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-emerald-700 to-teal-700 text-white w-64 transform transition-transform duration-300 z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 shadow-2xl`}
      >
        <div className="p-6 border-b border-emerald-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Bus className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-white">TRANZO</h2>
              <p className="text-emerald-200">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeMenu === item.id
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

        <div className="absolute bottom-0 left-0 right-0 p-4">
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
                <h1 className="text-gray-800">Create Trip</h1>
                <p className="text-gray-500">Schedule a new transport trip</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <Card className="p-8 rounded-2xl shadow-lg border-none bg-white max-w-5xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle and Driver Selection */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="vehicle" className="text-gray-700 mb-2 block">
                    Select Vehicle
                  </Label>
                  <Select
                    value={formData.vehicleNumber}
                    onValueChange={handleVehicleChange}
                    required
                  >
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue placeholder="Choose vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.vehicle_number}>
                          {vehicle.make} {vehicle.model} - {vehicle.vehicle_number} (Capacity: {vehicle.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedVehicle && (
                    <p className="text-sm text-emerald-600 mt-2">
                      ✓ {selectedVehicle.capacity} passenger capacity
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="driver" className="text-gray-700 mb-2 block">
                    Select Driver
                  </Label>
                  <Select
                    value={formData.driverName}
                    onValueChange={(value: string) => setFormData({ ...formData, driverName: value })}
                    required
                  >
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue placeholder="Choose driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {driver.user_name || driver.name} - {driver.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="pickup" className="text-gray-700 mb-2 block">
                    Pickup Location
                  </Label>
                  <Select
                    value={formData.pickupLocation}
                    onValueChange={(value: string) => setFormData({ ...formData, pickupLocation: value })}
                    required
                  >
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue placeholder="Select pickup point" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Andheri East">Andheri East</SelectItem>
                      <SelectItem value="Powai">Powai</SelectItem>
                      <SelectItem value="BKC">BKC</SelectItem>
                      <SelectItem value="Lower Parel">Lower Parel</SelectItem>
                      <SelectItem value="Worli">Worli</SelectItem>
                      <SelectItem value="Goregaon">Goregaon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="drop" className="text-gray-700 mb-2 block">
                    Drop Location
                  </Label>
                  <Select
                    value={formData.dropLocation}
                    onValueChange={(value: string) => setFormData({ ...formData, dropLocation: value })}
                    required
                  >
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue placeholder="Select drop point" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BKC Office">BKC Office</SelectItem>
                      <SelectItem value="Lower Parel Office">Lower Parel Office</SelectItem>
                      <SelectItem value="Powai Office">Powai Office</SelectItem>
                      <SelectItem value="Andheri Office">Andheri Office</SelectItem>
                      <SelectItem value="Worli Office">Worli Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Trip Details */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="date" className="text-gray-700 mb-2 block">
                    Trip Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="rounded-xl bg-gray-50"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="time" className="text-gray-700 mb-2 block">
                    Trip Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="rounded-xl bg-gray-50"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tripType" className="text-gray-700 mb-2 block">
                    Trip Type
                  </Label>
                  <Select
                    value={formData.tripType}
                    onValueChange={(value: string) => setFormData({ ...formData, tripType: value })}
                    required
                  >
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pick">Pick</SelectItem>
                      <SelectItem value="Drop">Drop</SelectItem>
                      <SelectItem value="Pick & Drop">Pick & Drop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Employee Names */}
              {selectedVehicle && (
                <div>
                  <Label className="text-gray-700 mb-3 block">
                    Employee Names (Capacity: {selectedVehicle.capacity})
                  </Label>
                  <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-xl">
                    {employeeFields.map((employee, index) => (
                      <div key={index}>
                        <Label className="text-sm text-gray-600 mb-1 block">
                          Employee {index + 1}
                        </Label>
                        <Select
                          value={employee}
                          onValueChange={(value: string) => handleEmployeeChange(index, value)}
                        >
                          <SelectTrigger className="rounded-xl bg-white">
                            <SelectValue placeholder={`Select employee ${index + 1}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.full_name || emp.name} - {emp.employee_id || emp.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Leave fields empty for unassigned seats
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="h-12 rounded-xl border-2 border-gray-300 hover:border-emerald-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-12 rounded-xl"
                >
                  Create Trip & Send Confirmations
                </Button>
              </div>
            </form>
          </Card>
        </main>
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