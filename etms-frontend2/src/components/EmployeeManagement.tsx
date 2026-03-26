import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Leaf,
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
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import TranzoLogo from './TranzoLogo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { useAuth } from '../context/AuthContext';

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('users');
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

  const [employees] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@company.com', department: 'IT', route: 'Route A', status: 'Active' },
    { id: 2, name: 'Sarah Smith', email: 'sarah.smith@company.com', department: 'HR', route: 'Route B', status: 'Active' },
    { id: 3, name: 'Mike Johnson', email: 'mike.j@company.com', department: 'Finance', route: 'Route A', status: 'Active' },
    { id: 4, name: 'Emily Davis', email: 'emily.d@company.com', department: 'Marketing', route: 'Route C', status: 'Inactive' },
    { id: 5, name: 'Robert Brown', email: 'robert.b@company.com', department: 'Operations', route: 'Route B', status: 'Active' },
    { id: 6, name: 'Lisa Wilson', email: 'lisa.w@company.com', department: 'IT', route: 'Route A', status: 'Active' },
  ]);

  const filteredEmployees = employees.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.name.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      e.department.toLowerCase().includes(term) ||
      e.route.toLowerCase().includes(term) ||
      e.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-emerald-700 to-teal-700 text-white w-64 transform transition-transform duration-300 z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeMenu === item.id
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-emerald-100 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-emerald-600">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">
                {user?.full_name || 'Admin User'}
              </p>
              <p className="text-emerald-200 text-xs">
                {user?.email || 'admin@etms.com'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-emerald-100 hover:text-white hover:bg-emerald-600 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
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
                  <h1 className="text-gray-900 mb-2">Employee Management</h1>
                  <p className="text-gray-600">Manage employee records and transport assignments</p>
                </div>
                <Button 
                  onClick={() => navigate('/admin/employees/new')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
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
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Button variant="outline" className="rounded-xl">
              Filter by Route
            </Button>
            <Button variant="outline" className="rounded-xl">
              Filter by Department
            </Button>
          </div>
        </Card>

        {/* Employees Table */}
        <Card className="bg-gradient-to-br from-white to-teal-50/30 rounded-2xl overflow-hidden border-emerald-200 shadow-lg">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="text-gray-900">{employee.name}</TableCell>
                    <TableCell className="text-gray-600">{employee.email}</TableCell>
                    <TableCell className="text-gray-600">{employee.department}</TableCell>
                    <TableCell className="text-gray-600">{employee.route}</TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full inline-block ${
                          employee.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {employee.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
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
    </div>
  );
}