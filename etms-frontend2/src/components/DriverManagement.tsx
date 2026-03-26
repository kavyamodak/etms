import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  LayoutDashboard,
  Users,
  Car,
  Route,
  TrendingUp,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  X,
  UserCog,
  Phone,
  Mail,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import TranzoLogo from './TranzoLogo';
import { useAuth } from '../context/AuthContext';
import { driverAPI } from '../services/api';
import { useNotify } from '../context/NotificationContext';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function DriverManagement() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const notify = useNotify();
  const [activeMenu, setActiveMenu] = useState('drivers');
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
  const [drivers, setDrivers] = useState<
    { id: number; name: string; phone: string; email: string; vehicle: string; route: string; rating: number; status: string }[]
  >([]);

  const fetchDrivers = async () => {
    try {
      const rows = await driverAPI.getAll();
      const normalized = (Array.isArray(rows) ? rows : []).map((r: any) => ({
        id: Number(r.id),
        name: String(r.full_name || ''),
        phone: String(r.phone || ''),
        email: String(r.email || ''),
        vehicle: String(r.vehicle_number || '-'),
        route: '-',
        rating: Number(r.rating ?? 0),
        status: String(r.effective_status || r.status || 'active'),
      }));
      setDrivers(normalized);
    } catch {
      setDrivers([]);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    driverId: number;
    driverName: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    driverId: 0,
    driverName: '',
    isDeleting: false,
  });

  const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      driverId: id,
      driverName: name,
      isDeleting: false,
    });
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await driverAPI.delete(deleteModal.driverId);
      notify.success('Driver deleted successfully.');
      fetchDrivers();
    } catch (err: any) {
      notify.error('Failed to delete driver: ' + err.message);
    } finally {
      setDeleteModal((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
    }
  };

  const handleEdit = (e: React.MouseEvent, driver: any) => {
    e.stopPropagation();
    navigate('/driver-details', { state: { editData: driver } });
  };

  const filteredDrivers = drivers.filter((driver) => {
    const term = searchTerm.toLowerCase();
    return (
      driver.name.toLowerCase().includes(term) ||
      driver.email.toLowerCase().includes(term) ||
      driver.phone.toLowerCase().includes(term) ||
      driver.vehicle.toLowerCase().includes(term) ||
      driver.status.toLowerCase().includes(term)
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

        {/* User Profile Section */}
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
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-gray-900 mb-2">Driver Management</h1>
                  <p className="text-gray-600">Manage drivers and their assignments</p>
                </div>
                <Button
                  onClick={() => navigate('/admin/drivers/add')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Driver
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl border-emerald-200 shadow-lg">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search drivers by name, phone, or vehicle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
                <Button variant="outline" className="rounded-xl">
                  Filter Status
                </Button>
                <Button variant="outline" className="rounded-xl">
                  Sort by Rating
                </Button>
              </div>
            </Card>

            {/* Drivers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrivers.map((driver) => {
                const statusLabel =
                  driver.status === 'inactive'
                    ? 'On Trip'
                    : driver.status === 'on_leave'
                      ? 'On Leave'
                      : 'Active';
                const statusClasses =
                  driver.status === 'inactive'
                    ? 'bg-amber-100 text-amber-700'
                    : driver.status === 'on_leave'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700';

                return (
                  <Card key={driver.id} className="p-6 bg-gradient-to-br from-white to-teal-50/30 rounded-2xl border-emerald-200 shadow-lg hover:shadow-xl transition-shadow relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                        <UserCog className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusClasses}`}>
                          {statusLabel}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:bg-blue-50" onClick={(e: React.MouseEvent) => handleEdit(e, driver)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:bg-red-50" onClick={(e: React.MouseEvent) => handleDeleteClick(e, driver.id, driver.name)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-gray-900 mb-1">{driver.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {driver.vehicle !== '-' ? `Vehicle: ${driver.vehicle}` : 'Unassigned'}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">{driver.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium truncate">{driver.email}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Route</span>
                        <span className="text-sm font-medium text-gray-900">{driver.route !== '-' ? driver.route : 'Standby'}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500">Rating</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-yellow-600">{driver.rating}</span>
                          <span className="text-yellow-400 text-sm">★</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
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
        entityName={deleteModal.driverName}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
}