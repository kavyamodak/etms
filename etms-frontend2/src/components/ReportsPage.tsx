import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Route as RouteIcon, Calendar, Car, CreditCard, MessageSquare,
  LogOut, Menu, X, MapPin, Clock, Users, Map, ExternalLink,
  Milestone, Radio, TrendingUp, UserCog, Navigation, ArrowRight, CheckCircle,
  Download, Star, AlertTriangle, ThumbsUp, BarChart3,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import TranzoLogo from './TranzoLogo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useAuth } from '../context/AuthContext';
import { feedbackAPI } from '../services/api';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('reports');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [feedbackData, setFeedbackData] = useState<any[]>([]);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        console.log('Fetching feedback data...');
        const feedback = await feedbackAPI.getAll();
        console.log('Feedback data received:', feedback);
        setFeedbackData(feedback);
      } catch (error) {
        console.error('Failed to load feedback:', error);
        setFeedbackData([]);
      }
    };
    loadFeedback();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadFeedback, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'users', label: 'Employees', icon: Users, path: '/admin/users' },
    { id: 'drivers', label: 'Drivers', icon: UserCog, path: '/admin/drivers' },
    { id: 'vehicles', label: 'Vehicles', icon: Car, path: '/admin/vehicles' },
    { id: 'routes', label: 'Routes', icon: RouteIcon, path: '/admin/routes' },
    { id: 'trips', label: 'Trips', icon: TrendingUp, path: '/admin/trips' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  ];

  // Calculate analytics from real feedback data
  const totalFeedback = feedbackData.length;
  const complaintsCount = feedbackData.filter((f: any) => f.feedback_type === 'complaint').length;
  const appreciationsCount = feedbackData.filter((f: any) => f.feedback_type === 'appreciation').length;
  const averageRating = feedbackData.length > 0
    ? (feedbackData.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedbackData.length).toFixed(1)
    : '0.0';

  const analytics = [
    {
      title: 'Total Feedback',
      value: totalFeedback,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Complaints',
      value: complaintsCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Appreciations',
      value: appreciationsCount,
      icon: ThumbsUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Average Rating',
      value: averageRating,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  const handleLogout = (): void => {
    logout();
    navigate('/login', { replace: true });
  };

  const refreshData = async () => {
    try {
      console.log('Manually refreshing feedback data...');
      const feedback = await feedbackAPI.getAll();
      console.log('Refreshed feedback data:', feedback);
      setFeedbackData(feedback);
    } catch (error) {
      console.error('Failed to refresh feedback:', error);
    }
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
                <h1 className="text-gray-800">Reports & Analytics</h1>
                <p className="text-gray-500">System insights and feedback</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Period Selector */}
          <div className="flex justify-end mb-6">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {analytics.map((stat, index) => (
              <Card key={index} className={`p-6 rounded-2xl shadow-lg border-none ${stat.bgColor} bg-opacity-10`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                </div>
                <div className="mt-4">
                  <BarChart3 className="w-full h-32 text-gray-300" />
                </div>
              </Card>
            ))}
          </div>

          {/* Feedback Table */}
          <Card className="rounded-2xl shadow-lg border-none bg-white">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-gray-800">Recent Feedback</h2>
                <p className="text-gray-500">Latest employee feedback and complaints</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
            <div className="p-6">
              {feedbackData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-500">Source</TableHead>
                      <TableHead className="font-semibold text-gray-500">Category</TableHead>
                      <TableHead className="font-semibold text-gray-500">From</TableHead>
                      <TableHead className="font-semibold text-gray-500">Regarding</TableHead>
                      <TableHead className="font-semibold text-gray-500">Rating</TableHead>
                      <TableHead className="font-semibold text-gray-500">Date</TableHead>
                      <TableHead className="font-semibold text-gray-500">Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbackData.map((f: any) => (
                      <TableRow key={f.id} className="hover:bg-gray-50/30 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <p className="text-[10px] font-semibold text-emerald-600 mb-1">Status</p>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${f.submitted_by_role === 'driver' 
                                ? 'bg-purple-50 text-purple-700 ring-purple-100' 
                                : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                              }`}
                            >
                              {f.submitted_by_role || 'Employee'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                            f.feedback_type === 'complaint'
                              ? 'bg-red-50 text-red-700 border border-red-100'
                              : f.feedback_type === 'appreciation'
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {f.feedback_type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {f.submitted_by_role === 'driver' ? f.driver_name : f.employee_name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <h3 className="text-base font-semibold text-gray-900 mb-2 leading-tight">
                            {f.employee_name || f.driver_name || 'Anonymous Feedback'}
                          </h3>
                          <div className="text-sm">
                            {f.submitted_by_role === 'driver' ? f.employee_name : f.driver_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Star className={`w-4 h-4 ${f.rating >= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            <span className="font-bold text-gray-700">{f.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 font-medium">
                          {new Date(f.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-gray-600 italic line-clamp-2">
                            "{f.message}"
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No feedback submitted yet</p>
                  <p className="text-gray-400 text-sm">Feedback from employees will appear here</p>
                </div>
              )}
            </div>
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
