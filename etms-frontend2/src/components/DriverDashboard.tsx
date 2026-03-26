import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Route as RouteIcon, Calendar, Car,
  MessageSquare, LogOut, Menu, X, MapPin, Clock,
  CheckCircle, Star, TrendingUp, Users, RefreshCw, Maximize2, UserCog, CreditCard, Wallet,
  Radio, Navigation,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table';
import { useAuth } from '../context/AuthContext';
import TranzoLogo from './TranzoLogo';
import { driverAPI, tripAPI, paymentAPI } from '../services/api';
import MapRouteLeaflet from './MapRouteLeaflet';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-emerald-100 text-emerald-700',
    scheduled: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllTrips, setShowAllTrips] = useState(false);

  const [driverData, setDriverData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [data, payRes] = await Promise.all([
        driverAPI.getMyProfile(),
        paymentAPI.getMyDriverPayouts().catch(() => null),
      ]);
      setDriverData(data);
      if (payRes?.success) setPaymentSummary(payRes.summary);
    } catch {
      // silently keep existing data or null on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/driver' },
    { id: 'routes', label: 'Assigned Routes', icon: RouteIcon, path: '/driver/routes' },
    { id: 'schedule', label: 'Pickup Status', icon: Calendar, path: '/driver/attendance' },
    { id: 'vehicle', label: 'Vehicle Details', icon: Car, path: '/driver/vehicle-details' },
    { id: 'payments', label: 'My Payments', icon: CreditCard, path: '/driver/payments' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/driver/feedback' },
  ];

  // Derived values
  const driver = driverData?.driver;
  const stats = driverData?.stats;
  const trips: any[] = driverData?.trips || [];

  const upcomingTrips = trips
    .filter(t => {
      const isPending = t.status === 'scheduled' || t.status === 'in_progress';
      // For multi-stop, we show even if scheduled time is slightly in the past (active route)
      return isPending;
    })
    .sort((a, b) => {
      // Sort by status first (in_progress first), then by sequence_number, then by time
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
      if (a.sequence_number && b.sequence_number) return a.sequence_number - b.sequence_number;
      return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
    })
    .slice(0, 8);

  const currentAssignment = upcomingTrips[0] || null;
  const activeTrip = currentAssignment?.status === 'in_progress' ? currentAssignment : null;
  const nextTrip = currentAssignment?.status === 'scheduled' ? currentAssignment : null;

  // Stat cards — mirrors Admin dashboardStats pattern exactly
  const dashboardStats = [
    {
      label: "Today's Trips",
      value: loading ? '—' : String(stats?.today_total ?? 0),
      sub: loading ? '' : `${stats?.today_completed ?? 0} done · ${stats?.today_scheduled ?? 0} pending`,
      icon: Calendar,
      color: 'bg-emerald-500',
      path: '/driver/attendance',
    },
    {
      label: 'Assignments',
      value: loading ? '—' : String(upcomingTrips.length),
      sub: 'View routes →',
      icon: RouteIcon,
      color: 'bg-teal-500',
      path: '/driver/routes',
    },
    {
      label: 'Total Trips',
      value: loading ? '—' : String(stats?.total_trips ?? 0),
      sub: 'All time',
      icon: TrendingUp,
      color: 'bg-orange-500',
      path: '/driver/routes',
    },
    {
      label: 'My Rating',
      value: loading ? '—' : (parseFloat(stats?.avg_rating || '0') > 0 ? stats?.avg_rating : '—'),
      sub: loading ? '' : `${stats?.total_ratings ?? 0} review${stats?.total_ratings !== 1 ? 's' : ''}`,
      icon: Star,
      color: 'bg-blue-500',
      path: '/driver/feedback',
    },
  ];

  const handleMarkComplete = async (tripId: number) => {
    try {
      await tripAPI.updateStatus(tripId, 'completed');
      await fetchData();
    } catch {
      // silent fail
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-emerald-700 to-teal-700 text-white w-64 transform transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl`}>
        <div className="p-6 border-b border-emerald-600">
          <TranzoLogo size="medium" showText={true} />
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.id === 'dashboard'
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
          <div
            className="bg-emerald-600 rounded-xl p-3 cursor-pointer hover:bg-emerald-500 transition-colors"
            onClick={() => navigate('/profile')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <UserCog className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.full_name || 'Driver'}</p>
                <p className="text-emerald-200 text-xs truncate">{user?.email || 'driver@company.com'}</p>
              </div>
            </div>
          </div>

          <Button onClick={handleLogout} className="w-full flex items-center gap-3 bg-red-500 hover:bg-red-600 rounded-xl">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="lg:ml-64">

        {/* Top Bar — matches Admin exactly */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                {sidebarOpen ? <X /> : <Menu />}
              </Button>
              <div>
                <h1 className="text-gray-900 font-bold">Driver Dashboard</h1>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">

          {/* ── Stat Cards — identical pattern to Admin dashboardStats ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="p-6 rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100/50 bg-white/80 backdrop-blur-md transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:bg-white flex flex-col justify-between"
                  onClick={() => navigate(stat.path)}
                >
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-${stat.color.split('-')[1]}-500/30`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                      <p className="text-gray-900 font-medium">{stat.label}</p>
                      <p className="text-gray-500 text-sm mt-1">{stat.sub}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ── Current Assignment + Vehicle + Payments — equal 3-column grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Current / Next Assignment */}
            <Card
              className="p-6 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 border border-emerald-400/30 bg-gradient-to-br from-emerald-600 to-teal-700 text-white cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              onClick={() => currentAssignment ? navigate(`/driver/transport-details/${currentAssignment.id}`) : navigate('/driver/routes')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-emerald-100 font-medium tracking-wide mb-1">
                    {activeTrip ? 'Current Trip' : nextTrip ? 'Next Assignment' : 'No Assignment'}
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight text-white truncate">
                    {loading
                      ? '—'
                      : currentAssignment
                        ? (currentAssignment.route_name || `${currentAssignment.start_location} → ${currentAssignment.end_location}`)
                        : 'No upcoming trips'}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {currentAssignment?.sequence_number && (
                    <span className="text-[10px] bg-white/20 text-white px-3 py-1 rounded-full font-black tracking-widest border border-white/20">
                      STOP {currentAssignment.sequence_number}
                    </span>
                  )}
                  {activeTrip && (
                    <span className="text-[10px] bg-white text-emerald-700 px-3 py-1 rounded-full animate-pulse font-black  tracking-wider shadow-sm">LIVE</span>
                  )}
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                    <Clock className="w-6 h-6 text-emerald-50" />
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="h-8 flex items-center">
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                </div>
              ) : currentAssignment ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                    <span className="truncate">{currentAssignment.start_location} → {currentAssignment.end_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                    <span className="truncate">
                      {new Date(currentAssignment.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  {activeTrip && (
                    <Button
                      onClick={(e: React.MouseEvent) => { 
                        e.stopPropagation(); 
                        window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(activeTrip.start_location)}&destination=${encodeURIComponent(activeTrip.end_location)}`, '_blank');
                      }}
                      className="mt-2 w-full bg-white text-emerald-700 hover:bg-emerald-50 font-semibold rounded-xl text-sm py-1.5"
                    >
                      Start Navigation
                    </Button>
                  )}
                </div>
              ) : (
                <div className="opacity-70 text-sm space-y-1">
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /><span>—</span></div>
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>—</span></div>
                </div>
              )}
            </Card>

            {/* Vehicle Card */}
            <Card
              className="p-6 rounded-3xl shadow-lg border border-gray-100/50 bg-white/80 backdrop-blur-md cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white flex flex-col justify-between"
              onClick={() => navigate('/driver/vehicle-details')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <Car className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-gray-500 font-medium mb-1">My Vehicle</p>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                  {loading ? '—' : (driver?.vehicle_number || 'No Vehicle')}
                </h3>
              </div>
              {loading ? (
                <p className="text-gray-400">Loading...</p>
              ) : driver?.vehicle_number ? (
                <div className="space-y-1 border-t border-gray-100 pt-3 mt-1">
                  {driver.vehicle_type && (
                    <p className="text-gray-500 text-sm">Type: <span className="font-semibold text-gray-700 capitalize">{driver.vehicle_type}</span></p>
                  )}
                  {driver.model && (
                    <p className="text-gray-500 text-sm">Model: <span className="font-semibold text-gray-700">{driver.model}</span></p>
                  )}
                  <span className={`mt-2 inline-block px-3 py-1.5 rounded-xl text-[10px] font-bold  tracking-wider shadow-sm ${driver.vehicle_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {driver.vehicle_status || 'unknown'}
                  </span>
                </div>
              ) : (
                <p className="text-gray-600 border-t border-gray-100 pt-3 mt-1 text-sm">No vehicle assigned. Contact admin.</p>
              )}
            </Card>

            {/* Payments Summary Card */}
            <Card
              className="p-6 rounded-3xl shadow-lg border border-gray-100/50 bg-white/80 backdrop-blur-md cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white flex flex-col justify-between"
              onClick={() => navigate('/driver/payments')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-emerald-500 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-500 font-medium mb-1">My Earnings</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                  {loading ? '—' : `₹${Number(paymentSummary?.total_received || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </h3>
              </div>
              <div className="space-y-1 border-t border-gray-100 pt-3 mt-1">
                <p className="text-gray-500 text-sm">Received: <span className="font-semibold text-gray-700">{paymentSummary?.success_payouts || 0} payments</span></p>
                {(paymentSummary?.pending_amount || 0) > 0 && (
                  <p className="text-gray-500 text-sm">Pending: <span className="font-semibold text-gray-700">₹{Number(paymentSummary.pending_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></p>
                )}
                <span className="mt-2 inline-block px-3 py-1.5 rounded-xl font-bold text-[10px]  tracking-wider bg-emerald-100 text-emerald-700 shadow-sm transition-colors hover:bg-emerald-200">
                  View History →
                </span>
              </div>
            </Card>

          </div>

          {/* ── Active Trip Navigation Map ── */}
          {activeTrip && (
            <Card className="p-6 rounded-3xl shadow-lg border border-emerald-200/50 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-md overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-emerald-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Navigation</h3>
                    <p className="text-sm text-gray-500">Your current route visualization</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white" style={{ height: '500px' }}>
                <MapRouteLeaflet
                  pickupPoints={[
                    {
                      address: activeTrip.start_location,
                      sequence_number: activeTrip.sequence_number
                    }
                  ]}
                  destination={{
                    address: activeTrip.end_location,
                  }}
                />
              </div>
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200/50 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Route: <span className="font-semibold text-gray-900">{activeTrip.start_location} → {activeTrip.end_location}</span></p>
                </div>
                <Button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(activeTrip.start_location)}&destination=${encodeURIComponent(activeTrip.end_location)}`, '_blank')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  Open in Maps
                </Button>
              </div>
            </Card>
          )}

        </main>
      </div>

      {/* ── Full Trips Modal — mirrors Admin full activity modal ── */}
      {showAllTrips && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-white rounded-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl text-gray-800">All Assignments</h2>
                <p className="text-gray-500">Complete trip history</p>
              </div>
              <Button onClick={() => setShowAllTrips(false)} variant="outline" className="rounded-xl">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date &amp; Time</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow
                      key={trip.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/driver/transport-details/${trip.id}`)}
                    >
                      <TableCell className="font-medium">
                        {new Date(trip.scheduled_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <div className="text-sm text-gray-500">
                          {new Date(trip.scheduled_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell>{trip.route_name || `${trip.start_location} → ${trip.end_location}`}</TableCell>
                      <TableCell>{trip.employee_name || '—'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{trip.vehicle_number || driver?.vehicle_number || '—'}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full inline-block text-xs ${statusBadge(trip.status)}`}>
                          {trip.status.replace('_', ' ')}
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}