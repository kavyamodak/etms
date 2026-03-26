import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  MessageSquare,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useAuth } from '../context/AuthContext';
import { tripAPI, profileAPI } from '../services/api';
import TranzoLogo from './TranzoLogo';
import { useNotify } from '../context/NotificationContext';

export default function RequestTransport() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const notify = useNotify();
  const [activeMenu, setActiveMenu] = useState('request');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectCode: '',
    officeLocation: '',
    reason: '',
    requestType: '',
    date: '',
    shift: '',
    pickupLocation: '', // Added pickup location
    pickupTime: '', // Added pickup time
  });

  // Load employee pickup point on mount
  useEffect(() => {
    const loadEmployeeProfile = async () => {
      try {
        const profileData = await profileAPI.getMe();
        if (profileData.employee && profileData.employee.location) {
          setFormData((prev) => ({ ...prev, pickupLocation: profileData.employee.location }));
        }
      } catch (err) {
        console.warn('Failed to load employee profile:', err);
      }
    };

    loadEmployeeProfile();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/user' },
    { id: 'trips', label: 'My Trips', icon: MapPin, path: '/user/trips' },
    { id: 'request', label: 'Request Trip', icon: PlusCircle, path: '/user/request' },
    { id: 'maps', label: 'Maps', icon: MapPin, path: '/user/maps' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/user/feedback' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const scheduled = `${formData.date}T${formData.shift}:00`;

      if (new Date(scheduled).getTime() < Date.now()) {
        notify.warning('You cannot select a past date and time for the trip.');
        return;
      }

      const id = notify.loading('Submitting your trip request...');
      try {
        await tripAPI.requestTrip({
          start_location: formData.pickupLocation,
          end_location: formData.officeLocation,
          scheduled_time: scheduled,
        });
        notify.updateNotification(id, { message: 'Trip request submitted successfully!', type: 'success' });
        navigate('/user');
      } catch (err: any) {
        notify.updateNotification(id, { message: 'Failed to submit request: ' + (err.message || err), type: 'error' });
      }
    } catch (err: any) {
      notify.error('Unexpected error: ' + (err.message || err));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
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
                <h1 className="text-gray-800">Request Trip</h1>
                <button
                  className="text-red-600 hover:text-red-700 text-sm"
                  onClick={() => navigate('/user')}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <Card className="p-6 rounded-2xl shadow-lg border-none bg-white max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Project Code */}
                <div>
                  <Label htmlFor="projectCode" className="text-gray-700 mb-2 block">
                    Project Code
                  </Label>
                  <Select
                    value={formData.projectCode}
                    onValueChange={(value: string) => setFormData({ ...formData, projectCode: value })}
                    required
                  >
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue placeholder="Select project code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="101096073">101096073</SelectItem>
                      <SelectItem value="101096074">101096074</SelectItem>
                      <SelectItem value="101096075">101096075</SelectItem>
                      <SelectItem value="101096076">101096076</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Office Location */}
                <div>
                  <Label htmlFor="officeLocation" className="text-gray-700 mb-2 block">
                    Office Location
                  </Label>
                  <Input
                    id="officeLocation"
                    type="text"
                    value={formData.officeLocation}
                    onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                    placeholder="Enter office location"
                    className="rounded-xl bg-gray-50"
                    required
                  />
                </div>

                {/* Pickup Location */}
                <div>
                  <Label htmlFor="pickupLocation" className="text-gray-700 mb-2 block">
                    Pickup Location
                  </Label>
                  <Input
                    id="pickupLocation"
                    type="text"
                    value={formData.pickupLocation}
                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                    placeholder="Enter pickup location"
                    className="rounded-xl bg-gray-50"
                    required
                  />
                </div>

                {/* Reason */}
                <div>
                  <Label htmlFor="reason" className="text-gray-700 mb-2 block">
                    Reason
                  </Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value: string) => setFormData({ ...formData, reason: value })}
                    required
                  >
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Extended shift hours">Extended shift hours</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                      <SelectItem value="Personal emergency">Personal emergency</SelectItem>
                      <SelectItem value="Roster not updated as per approved shift">
                        Roster not updated as per approved shift
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Request Type */}
                <div>
                  <Label htmlFor="requestType" className="text-gray-700 mb-2 block">
                    Request Type
                  </Label>
                  <Select
                    value={formData.requestType}
                    onValueChange={(value: string) => setFormData({ ...formData, requestType: value })}
                    required
                  >
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pick">Pick</SelectItem>
                      <SelectItem value="Drop">Drop</SelectItem>
                      <SelectItem value="Pick & Drop">Pick & Drop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div>
                  <Label htmlFor="date" className="text-gray-700 mb-2 block">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="rounded-xl bg-gray-50"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Shift */}
                <div>
                  <Label htmlFor="shift" className="text-gray-700 mb-2 block">
                    Time
                  </Label>
                  <Input
                    type="time"
                    id="shift"
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="rounded-xl bg-gray-50"
                    required
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/user')}
                  className="h-12 rounded-xl border-2 border-gray-300 hover:border-blue-600"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-xl"
                >
                  Raise Request
                </Button>
              </div>
            </form>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 p-6 bg-blue-50 rounded-2xl border-none max-w-4xl mx-auto">
            <h3 className="text-gray-900 mb-2">Request Guidelines</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Request Trip must be submitted at least 4 hours in advance</li>
              <li>• Late requests may be subject to availability</li>
              <li>• For emergency transport needs, contact the transport desk directly</li>
              <li>• You will receive a confirmation notification once approved</li>
              <li>• For emergency transport needs, contact the transport desk directly</li>
            </ul>
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