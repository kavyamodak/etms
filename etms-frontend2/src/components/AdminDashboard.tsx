import React, { useMemo, useState, useEffect } from 'react';
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
  TrendingUp,
  AlertCircle,
  UserCog,
  Bus,
  Maximize2,
  BarChart3,
  Plus,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import TranzoLogo from './TranzoLogo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { userAPI, driverAPI, vehicleAPI, tripAPI, paymentAPI } from '../services/api';
import { IndianRupee } from 'lucide-react';

function getInitials(fullName?: string, fallback?: string) {
  const raw = (fullName || fallback || '').trim();
  if (!raw) return 'U';
  const parts = raw.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) || '';
  return (first + last).toUpperCase();
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFullActivity, setShowFullActivity] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeVehicles: 0,
    dailyTrips: 0,
    totalPayouts: 0,
    employeesChange: '0%',
    vehiclesChange: '0%',
    tripsChange: '0%',
    payoutsChange: '0%'
  });

  // Fetch real-time data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [users, vehicles, trips, payoutsRes] = await Promise.all([
          userAPI.getAll(),
          vehicleAPI.getAll(),
          tripAPI.getAll(),
          paymentAPI.getHistory().catch(() => ({ success: false, payouts: [] })),
        ]);

        const totalEmployees = users.length;
        const activeVehicles = vehicles.filter((v: any) => v.status === 'active').length;
        const today = new Date().toISOString().split('T')[0];
        const dailyTrips = trips.filter((trip: any) => trip.created_at && trip.created_at.startsWith(today)).length;
        const payoutsList = payoutsRes.success ? (payoutsRes.payouts || []) : [];
        const totalPayouts = payoutsList.filter((p: any) => p.status === 'success').length;

        setStats({
          totalEmployees,
          activeVehicles,
          dailyTrips,
          totalPayouts,
          employeesChange: '+12%',
          vehiclesChange: '+3%',
          tripsChange: '+8%',
          payoutsChange: `${payoutsList.length} total`,
        });
      } catch (error) {
        console.error('Dashboard data fetch error:', error); // Debug log
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);
  const initials = useMemo(() => getInitials(user?.full_name, user?.email), [user?.full_name, user?.email]);

  useEffect(() => {
    let mounted = true;
    tripAPI
      .getAll()
      .then((rows) => {
        if (!mounted) return;
        const now = new Date();
        const normalized = (Array.isArray(rows) ? rows : [])
          .map((r: any) => ({
            id: r.id,
            employee: r.employee_name || '-',
            route: `${r.start_location || ''} → ${r.end_location || ''}`,
            date: new Date(r.scheduled_time).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            }),
            time: new Date(r.scheduled_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            status:
              r.status === 'completed'
                ? 'Completed'
                : r.status === 'in_progress'
                  ? 'In Progress'
                  : r.status === 'scheduled'
                    ? 'Scheduled'
                    : r.status,
            driver: r.driver_name || '-',
            vehicle: `${r.vehicle_type || ''} - ${r.vehicle_number || ''}`.trim() || '-',
          }));
        setRecentActivity(normalized);
      })
      .catch(() => {
        if (!mounted) return;
        setRecentActivity([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'users', label: 'Employees', icon: Users, path: '/admin/users' },
    { id: 'drivers', label: 'Drivers', icon: UserCog, path: '/admin/drivers' },
    { id: 'vehicles', label: 'Vehicles', icon: Car, path: '/admin/vehicles' },
    { id: 'routes', label: 'Routes', icon: Route, path: '/admin/routes' },
    { id: 'trips', label: 'Trips', icon: TrendingUp, path: '/admin/trips' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  ];

  const dashboardStats = [
    { label: 'Total Employees', value: stats.totalEmployees.toLocaleString(), change: stats.employeesChange, icon: Users, color: 'bg-emerald-500', path: '/admin/users' },
    { label: 'Active Vehicles', value: stats.activeVehicles.toLocaleString(), change: stats.vehiclesChange, icon: Car, color: 'bg-teal-500', path: '/admin/vehicles' },
    { label: 'Daily Trips', value: stats.dailyTrips.toLocaleString(), change: stats.tripsChange, icon: TrendingUp, color: 'bg-orange-500', path: '/admin/trips' },
    { label: 'Total Payouts', value: String(stats.totalPayouts), change: stats.payoutsChange, icon: IndianRupee, color: 'bg-blue-500', path: '/admin/payments' },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
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
                  if (item.path !== '#') {
                    navigate(item.path);
                  }
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
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
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
                <h1 className="text-gray-900 font-bold">Admin Dashboard</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="p-6 rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100/50 bg-white/80 backdrop-blur-md transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:bg-white"
                  onClick={() => navigate(stat.path)}
                >
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-${stat.color.split('-')[1]}-500/30`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium tracking-wide">
                        {stat.change}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                      <p className="text-gray-500 font-medium">{stat.label}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity Table */}
          <Card className="rounded-3xl shadow-xl border border-gray-100/50 bg-white/80 backdrop-blur-md overflow-hidden">
            <div className="p-8 border-b border-gray-100/80 flex items-center justify-between bg-white/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recent Trip Activity</h2>
                <p className="text-gray-500 font-medium mt-1">Latest trip logs and reports</p>
              </div>
              <Button
                onClick={() => setShowFullActivity(true)}
                variant="outline"
                className="flex items-center gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-colors shadow-sm"
              >
                <Maximize2 className="w-4 h-4" />
                View All
              </Button>
            </div>
            <div className="p-6 overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-b-gray-100">
                    <TableHead className="font-semibold text-gray-600">Employee</TableHead>
                    <TableHead className="font-semibold text-gray-600">Route</TableHead>
                    <TableHead className="font-semibold text-gray-600">Driver</TableHead>
                    <TableHead className="font-semibold text-gray-600">Vehicle</TableHead>
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Time</TableHead>
                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.slice(0, 5).map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-emerald-50/30 transition-colors border-b-gray-50">
                      <TableCell className="font-bold text-gray-800 py-4">{activity.employee}</TableCell>
                      <TableCell className="text-gray-600 font-medium py-4">{activity.route}</TableCell>
                      <TableCell className="text-gray-600 font-medium py-4">{activity.driver}</TableCell>
                      <TableCell className="text-sm text-gray-500 py-4">{activity.vehicle}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-600 py-4">{activity.date}</TableCell>
                      <TableCell className="text-gray-600 py-4">{activity.time}</TableCell>
                      <TableCell className="py-4">
                        <span
                          className={`px-3 py-1.5 rounded-full inline-block text-xs font-bold  tracking-wider ${activity.status === 'Completed'
                            ? 'bg-green-100 text-green-700 shadow-sm'
                            : activity.status === 'In Progress'
                              ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                              : 'bg-gray-100 text-gray-700 shadow-sm'
                            }`}
                        >
                          {activity.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </main>
      </div>

      {/* Full Activity Modal */}
      {showFullActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-white rounded-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl text-gray-800">All Trip Activity</h2>
                <p className="text-gray-500">Complete trip history and details</p>
              </div>
              <Button
                onClick={() => setShowFullActivity(false)}
                variant="outline"
                className="rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.employee}</TableCell>
                      <TableCell>{activity.route}</TableCell>
                      <TableCell>{activity.driver}</TableCell>
                      <TableCell className="text-sm text-gray-600">{activity.vehicle}</TableCell>
                      <TableCell className="text-sm text-gray-500">{activity.date}</TableCell>
                      <TableCell>{activity.time}</TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full inline-block text-xs ${activity.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : activity.status === 'In Progress'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {activity.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

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