import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Plus,
  Car,
  Calendar,
  Wrench,
  LayoutDashboard,
  Users,
  Route,
  TrendingUp,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  X,
  UserCog,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import TranzoLogo from './TranzoLogo';
import { useAuth } from '../context/AuthContext';
import { vehicleAPI } from '../services/api';
import { useNotify } from '../context/NotificationContext';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function VehicleManagement() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const notify = useNotify();
  const [activeMenu, setActiveMenu] = useState('vehicles');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'users', label: 'Employees', icon: Users, path: '/admin/users' },
    { id: 'drivers', label: 'Drivers', icon: UserCog, path: '/admin/drivers' },
    { id: 'vehicles', label: 'Vehicles', icon: Car, path: '/admin/vehicles' },
    { id: 'routes', label: 'Routes', icon: Route, path: '/admin/routes' },
    { id: 'trips', label: 'Trips', icon: TrendingUp, path: '/admin/trips' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  const [vehicles, setVehicles] = useState<
    {
      id: number;
      number: string;
      type: string;
      model: string;
      capacity: number;
      driver: string;
      status: string;
      lastService: string;
      nextService: string;
    }[]
  >([]);

  const fetchVehicles = async () => {
    try {
      const rows = await vehicleAPI.getAll();
      const normalized = (Array.isArray(rows) ? rows : []).map((r: any) => ({
        id: Number(r.id),
        number: String(r.vehicle_number || ''),
        type: String(r.vehicle_type || ''),
        model: [r.make, r.model].filter(Boolean).join(' ') || String(r.vehicle_type || '-'),
        capacity: Number(r.capacity ?? 0),
        driver: String(r.driver_name || 'Unassigned'),
        status: String(r.status || 'inactive'),
        lastService: '-',
        nextService: '-',
      }));
      setVehicles(normalized);
    } catch {
      setVehicles([]);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    vehicleId: number;
    vehicleName: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    vehicleId: 0,
    vehicleName: '',
    isDeleting: false,
  });

  const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      vehicleId: id,
      vehicleName: name,
      isDeleting: false,
    });
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await vehicleAPI.delete(deleteModal.vehicleId);
      notify.success('Vehicle deleted successfully.');
      fetchVehicles();
    } catch (err: any) {
      notify.error('Failed to delete vehicle: ' + err.message);
    } finally {
      setDeleteModal((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
    }
  };

  const handleEdit = (e: React.MouseEvent, vehicle: any) => {
    e.stopPropagation();
    navigate('/admin/vehicles/new', { state: { editData: vehicle } }); // Redirecting to vehicle add/edit form 
  };

  const filteredVehicles = vehicles.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      v.number.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      v.driver.toLowerCase().includes(term) ||
      v.status.toLowerCase().includes(term)
    );
  });

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
                  <h1 className="text-gray-900 mb-2">Vehicle Management</h1>
                  <p className="text-gray-600">Track and maintain your vehicle fleet</p>
                </div>
                <Button
                  onClick={() => navigate('/admin/vehicles/new')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </div>
            </div>

            {/* Search */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl border-emerald-200 shadow-lg">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
                <Button variant="outline" className="rounded-xl">
                  Filter by Status
                </Button>
              </div>
            </Card>

            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="p-6 bg-gradient-to-br from-white to-teal-50/30 rounded-2xl border-emerald-200 shadow-lg hover:shadow-xl transition-shadow relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                      <Car className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${vehicle.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : vehicle.status === 'maintenance'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {vehicle.status}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:bg-blue-50" onClick={(e: React.MouseEvent) => handleEdit(e, vehicle)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:bg-red-50" onClick={(e: React.MouseEvent) => handleDeleteClick(e, vehicle.id, vehicle.number)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-gray-900 mb-1">{vehicle.number}</h3>
                  <p className="text-gray-500 text-sm mb-1">{vehicle.type}</p>
                  <p className="text-gray-700 font-medium mb-4">{vehicle.model}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="text-gray-900">{vehicle.capacity} seats</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Driver:</span>
                      <span className="text-gray-900">{vehicle.driver}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Last Service: {vehicle.lastService}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Wrench className="w-4 h-4" />
                      <span>Next Service: {vehicle.nextService}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        entityName={deleteModal.vehicleName}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
}