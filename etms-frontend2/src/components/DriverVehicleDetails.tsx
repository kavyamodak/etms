import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  CreditCard,
  FileText,
  Calendar,
  Upload,
  Camera,
  Phone,
  Shield,
  Clock,
  CheckCircle,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Route as RouteIcon,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Hash,
  Users,
  Activity,
  UserCog,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import TranzoLogo from './TranzoLogo';
import { driverAPI } from '../services/api';


function ExpiryStatus({ date }: { date?: string }) {
  if (!date) return <span className="text-gray-400 text-sm font-medium">N/A</span>;
  const expiry = new Date(date);
  const now = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isValid = expiry > now;
  const isSoon = isValid && daysLeft <= 30;
  return (
    <div>
      <p className="text-gray-800 font-semibold">{expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
      <p className={`text-xs font-semibold mt-0.5 ${isValid ? (isSoon ? 'text-rose-500' : 'text-emerald-600') : 'text-red-500'}`}>
        {isValid ? (isSoon ? `⚠️ Expires in ${daysLeft} days` : '✓ Valid') : '✗ Expired'}
      </p>
    </div>
  );
}

export default function DriverVehicleDetails() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [driverData, setDriverData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await driverAPI.getMyProfile();
      setDriverData(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const driver = driverData?.driver;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/driver' },
    { id: 'routes', label: 'Assigned Routes', icon: RouteIcon, path: '/driver/routes' },
    { id: 'schedule', label: 'Pickup Status', icon: Calendar, path: '/driver/attendance' },
    { id: 'vehicle', label: 'Vehicle Details', icon: Car, path: '/driver/vehicle-details' },
    { id: 'payments', label: 'My Payments', icon: CreditCard, path: '/driver/payments' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/driver/feedback' },
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setUploading(false);
        console.log('Uploading vehicle condition photo:', file.name, new Date().toISOString());
      };
      reader.readAsDataURL(file);
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
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.id === 'vehicle'
                  ? 'bg-white text-emerald-700 shadow-lg'
                  : 'text-emerald-100 hover:bg-emerald-600'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          <div className="bg-emerald-600 rounded-xl p-3 cursor-pointer hover:bg-emerald-500 transition-colors" onClick={() => navigate('/profile')}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                <UserCog className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user?.full_name || 'Driver'}</p>
                <p className="text-emerald-200 text-xs truncate">{user?.email || 'driver@company.com'}</p>
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
                <h1 className="text-xl font-bold text-gray-800">Vehicle Details</h1>
                <p className="text-gray-500 text-sm mt-0.5">Your assigned vehicle information</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchData} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-base font-medium">Loading vehicle data...</p>
            </div>
          ) : !driver?.vehicle_number ? (
            <Card className="p-10 rounded-2xl shadow-lg border-none bg-white flex flex-col items-center justify-center text-center">
              <Car className="w-16 h-16 text-gray-200 mb-4" />
              <h2 className="text-xl font-bold text-gray-600 mb-2">No Vehicle Assigned</h2>
              <p className="text-gray-400 text-sm max-w-sm">
                You don't have a vehicle assigned yet. Please complete your onboarding or contact admin to assign a vehicle.
              </p>
            </Card>
          ) : (
            <>
              {/* Vehicle Overview Card */}
              <Card className="p-6 rounded-2xl shadow-lg border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  {driver.vehicle_image ? (
                    <img
                      src={driver.vehicle_image}
                      alt="Vehicle"
                      onClick={() => setFullscreenImage(driver.vehicle_image)}
                      title="Click to view full image"
                      className="w-12 h-12 object-cover rounded-xl border-2 border-white/30 cursor-pointer hover:opacity-80 transition-opacity drop-shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                      <Car className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold">Vehicle Overview</h2>
                  <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold  tracking-wider ${driver.vehicle_status === 'active' ? 'bg-white/20 text-white' : 'bg-black/10 text-white/90'}`}>
                    {driver.vehicle_status || 'Unknown'}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-20">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" /> Vehicle Number
                    </p>
                    <p className="text-white text-2xl font-bold mt-1">{driver.vehicle_number}</p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm font-medium flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5" /> Model
                    </p>
                    <p className="text-white text-xl font-bold mt-1">{driver.model || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm font-medium flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Type
                    </p>
                    <p className="text-white text-xl font-bold mt-1 capitalize">{driver.vehicle_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Capacity
                    </p>
                    <p className="text-white text-xl font-bold mt-1">{driver.capacity ? `${driver.capacity} seats` : 'N/A'}</p>
                  </div>
                </div>
              </Card>

              {/* Driver Info + Compliance split */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Driver Info */}
                <Card className="p-6 rounded-2xl shadow-sm border-none bg-white">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Driver Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm font-medium">Full Name</span>
                      <span className="text-gray-800 font-semibold text-sm">{driver.full_name || user?.full_name || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm font-medium">Phone</span>
                      <span className="text-gray-800 font-semibold text-sm">{driver.phone || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm font-medium">License Number</span>
                      <span className="text-gray-800 font-semibold text-sm font-mono">{driver.license_number || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm font-medium">License Expiry</span>
                      <ExpiryStatus date={driver.license_expiry} />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-500 text-sm font-medium">Driver Status</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${driver.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {driver.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Vehicle Compliance */}
                <Card className="p-6 rounded-2xl shadow-sm border-none bg-white">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Compliance & Documents</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <p className="font-semibold text-gray-700 text-sm">Registration Number</p>
                      </div>
                      <p className="text-gray-800 font-bold">{driver.registration_number || driver.vehicle_number || '—'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        <p className="font-semibold text-gray-700 text-sm">Insurance Expiry</p>
                      </div>
                      <ExpiryStatus date={driver.insurance_expiry} />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-teal-600" />
                        <p className="font-semibold text-gray-700 text-sm">PUC / Fitness Expiry</p>
                      </div>
                      <ExpiryStatus date={driver.puc_expiry || driver.fitness_expiry} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Upload Section */}
              <Card className="p-6 rounded-2xl shadow-sm border-none bg-white">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Vehicle Condition Photo</h3>
                    <p className="text-gray-500 text-sm mt-0.5">Upload before-trip condition report</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm">
                        <Camera className="w-4 h-4" />
                        <span>Choose Photo</span>
                      </div>
                    </label>
                    {uploading && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Uploading…</span>
                      </div>
                    )}
                    {uploadedImage && !uploading && (
                      <span className="text-green-600 text-sm font-semibold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Photo uploaded
                      </span>
                    )}
                  </div>

                  {uploadedImage && (
                    <div className="mt-4">
                      <p className="text-gray-500 text-xs font-medium mb-2">
                        Preview — Uploaded at {new Date().toLocaleString('en-IN')}
                      </p>
                      <img
                        src={uploadedImage}
                        alt="Vehicle condition"
                        className="w-full max-w-md rounded-xl border border-gray-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Fullscreen Image Overlay */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <button
              onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
              className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white p-2 transition-colors focus:outline-none"
              title="Close image"
            >
              <X className="w-8 h-8 drop-shadow-lg" />
            </button>
            <img
              src={fullscreenImage}
              alt="Vehicle Fullscreen"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black/50 ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </div>
  );
}
