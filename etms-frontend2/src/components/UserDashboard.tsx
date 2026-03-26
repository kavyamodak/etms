import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Map,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Clock,
  Calendar,
  Star,
  Bus,
  User,
  Lock as LockIcon,
  Radio,
  Navigation,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '../context/AuthContext';
import TranzoLogo from './TranzoLogo';
import { tripAPI } from '../services/api';
import RazorpayPayment from './RazorpayPayment';
import { UserLiveMapUI } from './UserLiveMapUI';

function getInitials(fullName?: string, fallback?: string) {
  const raw = (fullName || fallback || '').trim();
  if (!raw) return 'U';
  const parts = raw.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) || '';
  return (first + last).toUpperCase();
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const initials = useMemo(() => getInitials(user?.full_name, user?.email), [user?.full_name, user?.email]);

  useEffect(() => {
    let mounted = true;
    const now = new Date();
    tripAPI
      .getUserTrips()
      .then((rows) => {
        if (!mounted) return;
        const normalized = (Array.isArray(rows) ? rows : [])
          .filter((r: any) => {
            const tripTime = new Date(r.scheduled_time).getTime();
            if (Number.isNaN(tripTime)) return false;
            return true;
          })
          .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
          .map((r: any) => ({
            id: r.id,
            otp: r.otp,
            rawTime: new Date(r.scheduled_time).getTime(),
            date: new Date(r.scheduled_time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            time: new Date(r.scheduled_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            route: `${r.start_location || ''} → ${r.end_location || ''}`,
            status:
              r.status === 'completed'
                ? 'Completed'
                : r.status === 'in_progress'
                  ? 'In Progress'
                  : r.status === 'scheduled'
                    ? 'Scheduled'
                    : r.status === 'pending'
                      ? 'Pending'
                      : r.status,
            vehicle: r.vehicle_number || r.vehicle_type || '',
          }));
        setUpcomingTrips(normalized);
      })
      .catch(() => {
        if (!mounted) return;
        setUpcomingTrips([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/user' },
    { id: 'trips', label: 'My Trips', icon: MapPin, path: '/user/trips' },
    { id: 'request', label: 'Request Trip', icon: PlusCircle, path: '/user/request' },
    { id: 'maps', label: 'Maps', icon: Map, path: '/user/maps' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/user/feedback' },
  ];

  const tripRequests = [
    { type: 'Pending', count: 2, color: 'bg-orange-100 text-orange-700' },
    { type: 'Approved', count: 8, color: 'bg-green-100 text-green-700' },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const nextActiveTrip = upcomingTrips.find(t =>
    t.status === 'In Progress' ||
    (t.status === 'Scheduled' && (t.rawTime >= Date.now() - 7200000)) || // Keep for 2 hours after start if scheduled
    (t.status === 'Pending' && (t.rawTime >= Date.now() - 7200000))
  );

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
                <User className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{user?.full_name || 'User'}</p>
                <p className="text-emerald-200 text-xs">{user?.email || 'employee@company.com'}</p>
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
                <h1 className="text-gray-800">Employee Dashboard</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Info Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Next Trip Card */}
            <Card className="p-6 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 border border-emerald-400/30 bg-gradient-to-br from-emerald-600 to-teal-700 text-white cursor-pointer hover:-translate-y-1 transition-all duration-300" onClick={() => nextActiveTrip ? navigate(`/user/transport-details/${nextActiveTrip.id}`) : navigate('/user/trips')}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-emerald-100 font-medium tracking-wide mb-1">Next Trip</p>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {nextActiveTrip
                      ? new Date(nextActiveTrip.rawTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + nextActiveTrip.time
                      : 'No upcoming trips'}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                  <Clock className="w-6 h-6 text-emerald-50" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-emerald-50 font-medium">
                  <MapPin className="w-4 h-4" />
                  <span>{nextActiveTrip ? nextActiveTrip.route : '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-50 font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>{nextActiveTrip ? `Vehicle: ${nextActiveTrip.vehicle || 'TBD'}` : '—'}</span>
                </div>
              </div>

              {nextActiveTrip && (nextActiveTrip.status === 'Scheduled' || nextActiveTrip.status === 'In Progress') && (
                <div className="mt-5 flex flex-col gap-3">
                  {nextActiveTrip.otp && nextActiveTrip.status === 'Scheduled' && (
                    <div className="bg-black/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20 shadow-inner">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                          <LockIcon className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <p className="text-emerald-50 text-[10px] tracking-widest font-bold">Auth Code</p>
                          <p className="text-2xl font-mono font-black tracking-[0.2em]">{nextActiveTrip.otp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-emerald-100 tracking-wider font-bold mb-1">Valid For</p>
                        <p className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">24 HRS</p>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    variant="secondary"
                    className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-black rounded-2xl h-12 shadow-xl flex items-center justify-center gap-3 border-none"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      navigate('/user/maps');
                    }}
                  >
                    <Navigation className="w-5 h-5" />
                    Track Live Position
                  </Button>
                </div>
              )}
            </Card>

            {/* Request Trip Card */}
            <Card className="p-6 rounded-3xl shadow-lg border border-gray-100/50 bg-white/80 backdrop-blur-md cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-white flex flex-col justify-between" onClick={() => navigate('/user/request')}>
              <div className="flex items-start justify-between mb-2">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <PlusCircle className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-gray-500 font-medium mb-1">Need a ride?</p>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Book New Trip</h3>
                <p className="text-gray-500 text-sm">Schedule your next transport up to 24 hours in advance.</p>
              </div>
            </Card>

            {/* Trip Stats */}
            <Card className="p-6 rounded-3xl shadow-lg border border-gray-100/50 bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-xl flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <Star className="w-7 h-7 text-orange-600" />
                </div>
              </div>
              <div>
                <p className="text-gray-500 font-medium mb-1">Your Trip Requests</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">{upcomingTrips.length} Total</h3>
                <div className="flex gap-3">
                  <div className="px-3 py-1.5 rounded-xl font-bold text-xs bg-green-100 text-green-700 shadow-sm">
                    {upcomingTrips.filter(t => t.status === 'Completed' || t.status === 'Confirmed').length} Completed
                  </div>
                  <div className="px-3 py-1.5 rounded-xl font-bold text-xs bg-orange-100 text-orange-700 shadow-sm">
                    {upcomingTrips.filter(t => t.status === 'Scheduled' || t.status === 'Pending').length} Pending
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Live Trip Map Section - REMOVED AS PER USER REQUEST */}

          {/* Upcoming Trips Table */}
          <Card className="rounded-3xl shadow-xl border border-gray-100/50 bg-white/80 backdrop-blur-md overflow-hidden">
            <div className="p-8 border-b border-gray-100/80 bg-white/50">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Upcoming Trips</h2>
              <p className="text-gray-500 font-medium mt-1">Your scheduled transportation</p>
            </div>
            <div className="p-6 overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-b-gray-100">
                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600">Time</TableHead>
                    <TableHead className="font-semibold text-gray-600">Route</TableHead>
                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingTrips.map((trip) => (
                    <TableRow key={trip.id} className="cursor-pointer hover:bg-emerald-50/30 transition-colors border-b-gray-50" onClick={() => navigate(`/user/transport-details/${trip.id}`)}>
                      <TableCell className="text-gray-600 font-medium py-4">{trip.date}</TableCell>
                      <TableCell className="text-gray-600 font-medium py-4">{trip.time}</TableCell>
                      <TableCell className="text-gray-800 font-bold py-4">{trip.route}</TableCell>
                      <TableCell className="py-4">
                        <span
                          className={`px-3 py-1.5 rounded-full inline-block text-xs font-bold  tracking-wider ${trip.status === 'Confirmed' || trip.status === 'Scheduled'
                            ? 'bg-green-100 text-green-700 shadow-sm'
                            : 'bg-orange-100 text-orange-700 shadow-sm'
                            }`}
                        >
                          {trip.status}
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