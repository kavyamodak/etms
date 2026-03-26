import { useState, useEffect } from 'react';
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
  Star,
  Send,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Bus,
  User,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useAuth } from '../context/AuthContext';
import TranzoLogo from './TranzoLogo';
import { feedbackAPI, tripAPI } from '../services/api';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('feedback');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('--Select--');
  const [driverRating, setDriverRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [feedback, setFeedback] = useState('');
  const [journeySatisfied, setJourneySatisfied] = useState<boolean | null>(null);
  const [complaintCategory, setComplaintCategory] = useState('');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [appreciationMessage, setAppreciationMessage] = useState('');
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [trips, history] = await Promise.all([
          tripAPI.getUserTrips(),
          feedbackAPI.getMyFeedback() // This fetches feedbacks exclusively for the current user
        ]);

        const completedTrips = (trips || []).filter((t: any) => t.status === 'completed');
        setRecentTrips(completedTrips.map((t: any) => ({
          id: t.id,
          label: `${t.driver_name || 'Assigned Driver'} (${new Date(t.scheduled_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`,
          driver: t.driver_name || 'TBD',
          vehicle: t.vehicle_number || 'TBD',
        })));

        setFeedbackHistory(history || []);
      } catch (err) {
        console.error("Failed to load feedback data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/user' },
    { id: 'trips', label: 'My Trips', icon: MapPin, path: '/user/trips' },
    { id: 'request', label: 'Request Trip', icon: PlusCircle, path: '/user/request' },
    { id: 'maps', label: 'Maps', icon: Map, path: '/user/maps' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/user/feedback' },
  ];



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Map feedback category to backend feedback_type
      let feedbackType: 'complaint' | 'appreciation' | 'suggestion';
      if (feedbackCategory === 'Complaint') {
        feedbackType = 'complaint';
      } else if (feedbackCategory === 'Appreciation') {
        feedbackType = 'appreciation';
      } else {
        feedbackType = 'suggestion';
      }

      // Build message based on category
      let message = feedback;
      if (feedbackCategory === 'Complaint') {
        message = `${complaintCategory}: ${complaintDetails}`;
      } else if (feedbackCategory === 'Appreciation') {
        message = appreciationMessage;
      }

      const feedbackData = {
        trip_id: Number(selectedTrip),
        feedback_type: feedbackType,
        message: message,
        rating: Math.round((driverRating + vehicleRating + serviceRating) / 3),
      };

      console.log('Submitting feedback:', feedbackData);
      await feedbackAPI.submit(feedbackData);
      console.log('Feedback submitted successfully!');

      // Refresh history immediately
      const updatedHistory = await feedbackAPI.getMyFeedback();
      setFeedbackHistory(updatedHistory || []);
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
    }

    setSubmitted(true);

    setTimeout(() => {
      setDriverRating(0);
      setVehicleRating(0);
      setServiceRating(0);
      setFeedback('');
      setSelectedTrip('');
      setFeedbackCategory('--Select--');
      setJourneySatisfied(null);
      setComplaintCategory('');
      setComplaintDetails('');
      setAppreciationMessage('');
      setSubmitted(false);
    }, 2000);
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
                <h1 className="text-gray-900 font-bold">Feedback</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submit Feedback Form */}
            <Card className="p-6 rounded-2xl shadow-sm border-gray-100 bg-white">
              <div className="mb-6">
                <h2 className="text-gray-800">Submit Feedback</h2>
                <p className="text-gray-500">Share your experience about a completed trip</p>
              </div>

              {submitted && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5" />
                  <span>Feedback submitted successfully! Thank you for your response.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Category Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Category</label>
                    <Select value={feedbackCategory} onValueChange={setFeedbackCategory} required>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="--Select--">--Select--</SelectItem>
                        <SelectItem value="Feedback">Feedback</SelectItem>
                        <SelectItem value="Complaint">Complaint</SelectItem>
                        <SelectItem value="Appreciation">Appreciation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Show form only if category is selected */}
                  {feedbackCategory !== '--Select--' && (
                    <>
                      {/* Select Trip */}
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 mb-2">Select Trip</label>
                        <Select value={selectedTrip} onValueChange={setSelectedTrip} required>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Choose a recent trip" />
                          </SelectTrigger>
                          <SelectContent>
                            {recentTrips.map((trip) => (
                              <SelectItem key={trip.id} value={trip.id}>
                                {trip.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show rating sections only for Feedback and Complaint categories */}
                      {(feedbackCategory === 'Feedback' || feedbackCategory === 'Complaint') && (
                        <>
                          {/* Driver Rating */}
                          <div>
                            <label className="block text-gray-700 mb-3">Rate the Driver</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setDriverRating(star)}
                                  className="focus:outline-none transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`w-8 h-8 ${star <= driverRating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                      }`}
                                  />
                                </button>
                              ))}
                              <span className="ml-2 text-gray-600 self-center">
                                {driverRating > 0 && `${driverRating}/5`}
                              </span>
                            </div>
                          </div>

                          {/* Vehicle Rating */}
                          <div>
                            <label className="block text-gray-700 mb-3">Rate the Vehicle</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setVehicleRating(star)}
                                  className="focus:outline-none transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`w-8 h-8 ${star <= vehicleRating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                      }`}
                                  />
                                </button>
                              ))}
                              <span className="ml-2 text-gray-600 self-center">
                                {vehicleRating > 0 && `${vehicleRating}/5`}
                              </span>
                            </div>
                          </div>

                          {/* Service Rating */}
                          <div className="md:col-span-2">
                            <label className="block text-gray-700 mb-3">Overall Service Rating</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setServiceRating(star)}
                                  className="focus:outline-none transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`w-10 h-10 ${star <= serviceRating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                      }`}
                                  />
                                </button>
                              ))}
                              <span className="ml-2 text-gray-600 self-center">
                                {serviceRating > 0 && `${serviceRating}/5`}
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Show only for Complaint category */}
                      {feedbackCategory === 'Complaint' && (
                        <div className="md:col-span-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h3 className="text-red-800">File a Complaint</h3>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-gray-700 mb-2">Complaint Category</label>
                              <Select value={complaintCategory} onValueChange={setComplaintCategory} required>
                                <SelectTrigger className="rounded-xl bg-white">
                                  <SelectValue placeholder="Select complaint type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="driver_behavior">Driver Behavior</SelectItem>
                                  <SelectItem value="vehicle_condition">Vehicle Condition</SelectItem>
                                  <SelectItem value="route_timing">Route/Timing Issues</SelectItem>
                                  <SelectItem value="safety_concern">Safety Concern</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="block text-gray-700 mb-2">Complaint Details</label>
                              <Textarea
                                placeholder="Please describe your complaint in detail..."
                                value={complaintDetails}
                                onChange={(e) => setComplaintDetails(e.target.value)}
                                className="rounded-xl min-h-24 bg-white"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show only for Appreciation category */}
                      {feedbackCategory === 'Appreciation' && (
                        <div className="md:col-span-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-4">
                            <ThumbsUp className="w-5 h-5 text-green-600" />
                            <h3 className="text-green-800">Share Your Appreciation</h3>
                          </div>

                          <div>
                            <label className="block text-gray-700 mb-2">Appreciation Message</label>
                            <Textarea
                              placeholder="Share what you appreciated about the service..."
                              value={appreciationMessage}
                              onChange={(e) => setAppreciationMessage(e.target.value)}
                              className="rounded-xl min-h-24 bg-white"
                              required
                            />
                          </div>
                        </div>
                      )}

                      {/* General Comments - Show for all categories */}
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 mb-2">
                          {feedbackCategory === 'Appreciation' ? 'Additional Comments (Optional)' : 'Additional Comments (Optional)'}
                        </label>
                        <Textarea
                          placeholder="Tell us more about your experience..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="rounded-xl min-h-24"
                        />
                      </div>
                    </>
                  )}
                </div>

                {feedbackCategory !== '--Select--' && (
                  <Button
                    type="submit"
                    className={`w-full rounded-xl ${feedbackCategory === 'Complaint'
                      ? 'bg-red-500 hover:bg-red-600'
                      : feedbackCategory === 'Appreciation'
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-teal-500 hover:bg-teal-600'
                      }`}
                    disabled={!selectedTrip ||
                      (feedbackCategory === 'Feedback' && (driverRating === 0 || vehicleRating === 0 || serviceRating === 0)) ||
                      (feedbackCategory === 'Complaint' && (driverRating === 0 || vehicleRating === 0 || serviceRating === 0 || !complaintDetails)) ||
                      (feedbackCategory === 'Appreciation' && !appreciationMessage)
                    }
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {feedbackCategory === 'Complaint' ? 'Submit Complaint' :
                      feedbackCategory === 'Appreciation' ? 'Submit Appreciation' :
                        'Submit Feedback'}
                  </Button>
                )}
              </form>
            </Card>

            <Card className="p-6 rounded-2xl shadow-sm border-gray-100 bg-white">
              <div className="mb-6">
                <h2 className="text-gray-800">Feedback History</h2>
                <p className="text-gray-500">Your past feedback submissions</p>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium">Loading history...</p>
                  </div>
                ) : feedbackHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No feedback submitted yet</p>
                  </div>
                ) : (
                  feedbackHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-2 transition-shadow hover:shadow-md ${item.feedback_type === 'complaint'
                        ? 'bg-red-50/50 border-red-100'
                        : 'bg-white border-gray-100'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {item.route_name || `${item.start_location} → ${item.end_location}`}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            Driver: <span className="text-emerald-700 font-medium">{item.driver_name || 'N/A'}</span>
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${star <= item.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-200 fill-gray-100'
                                  }`}
                              />
                            ))}
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${item.feedback_type === 'complaint'
                              ? 'bg-red-100 text-red-700'
                              : item.feedback_type === 'appreciation'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                              }`}
                          >
                            {item.feedback_type}
                          </span>
                        </div>
                      </div>
                      {item.message && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-gray-600 text-sm leading-relaxed">{item.message}</p>
                        </div>
                      )}
                      {item.is_resolved && (
                        <div className="mt-2 flex items-center gap-1.5 text-emerald-600">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Resolved</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
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