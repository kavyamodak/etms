import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Route as RouteIcon,
  Calendar,
  Car,
  CreditCard,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Star,
  ThumbsUp,
  RefreshCw,
  AlertCircle,
  MapPin,
  TrendingUp,
  UserCog,
  Send
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import TranzoLogo from './TranzoLogo';
import { feedbackAPI, tripAPI, driverFeedbackAPI } from '../services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';

function getInitials(fullName?: string, fallback?: string) {
  const raw = (fullName || fallback || '').trim();
  if (!raw) return 'U';
  const parts = raw.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) || '';
  return (first + last).toUpperCase();
}

interface FeedbackItem {
  id: number;
  trip_id: number;
  feedback_type: string;
  message: string;
  rating: number;
  created_at: string;
  is_resolved: boolean;
  employee_name: string;
  start_location: string;
  end_location: string;
  route_name?: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-100'}`}
        />
      ))}
    </div>
  );
}

export default function DriverFeedback() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState<'appreciation' | 'complaint' | 'suggestion' | ''>('');
  const [passengerRating, setPassengerRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/driver' },
    { id: 'routes', label: 'Assigned Routes', icon: RouteIcon, path: '/driver/routes' },
    { id: 'schedule', label: 'Pickup Status', icon: Calendar, path: '/driver/attendance' },
    { id: 'vehicle', label: 'Vehicle Details', icon: Car, path: '/driver/vehicle-details' },
    { id: 'payments', label: 'My Payments', icon: CreditCard, path: '/driver/payments' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/driver/feedback' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const fetchReceivedFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const data = await driverFeedbackAPI.getMyFeedback();
      setFeedback(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback');
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentTrips = useCallback(async () => {
    try {
      const data = await tripAPI.getUserTrips();
      if (Array.isArray(data)) {
        const completed = data.filter((t: any) => t.status === 'completed');
        setRecentTrips(completed);
      }
    } catch (err) {
      console.error("Failed to fetch recent trips:", err);
    }
  }, []);

  useEffect(() => {
    fetchReceivedFeedback();
    fetchRecentTrips();
  }, [fetchReceivedFeedback, fetchRecentTrips]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !feedbackCategory || passengerRating === 0) return;

    setIsSubmitting(true);
    try {
      await feedbackAPI.submit({
        trip_id: Number(selectedTrip),
        feedback_type: feedbackCategory as any,
        message: message,
        rating: passengerRating
      });
      setShowSubmitSuccess(true);
      setFeedbackCategory('');
      setPassengerRating(0);
      setMessage('');
      setSelectedTrip('');
      fetchReceivedFeedback(); // Refresh the reputation list if needed, or maybe add a givenFeedback list
      setTimeout(() => setShowSubmitSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((s, f) => s + Number(f.rating), 0) / feedback.length).toFixed(1)
      : '0.0';
  const positiveCount = feedback.filter((f) => f.rating >= 4).length;
  const complaints = feedback.filter((f) => f.feedback_type === 'complaint').length;

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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.id === 'feedback'
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
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
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
                <h1 className="text-xl font-bold text-gray-800">Feedback & Ratings</h1>
                <p className="text-gray-500 text-sm mt-0.5">Reviews from your recent trips</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchReceivedFeedback} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Profile"
              >
                <UserCog className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Summary Stats and Submit Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Submit Feedback Form */}
              <Card className="p-6 rounded-3xl shadow-sm border-gray-100 bg-white/80 backdrop-blur-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Submit Feedback</h2>
                    <p className="text-gray-500 text-sm">Rate your experience with a passenger</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-emerald-100" />
                </div>

                {showSubmitSuccess && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                      <ThumbsUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">Feedback submitted successfully!</span>
                  </div>
                )}

                <form onSubmit={handleSubmitFeedback} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Select Trip</label>
                      <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                        <SelectTrigger className="rounded-2xl border-gray-100 bg-gray-50/50 h-12">
                          <SelectValue placeholder="Choose a completed trip" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100">
                          {recentTrips.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm italic">No completed trips found yet</div>
                          ) : (
                            recentTrips.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>
                                {new Date(t.scheduled_time).toLocaleDateString()} - {t.start_location}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
                      <Select value={feedbackCategory} onValueChange={(val: any) => setFeedbackCategory(val)}>
                        <SelectTrigger className="rounded-2xl border-gray-100 bg-gray-50/50 h-12">
                          <SelectValue placeholder="Submission type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100">
                          <SelectItem value="appreciation">Appreciation</SelectItem>
                          <SelectItem value="complaint">Complaint</SelectItem>
                          <SelectItem value="suggestion">General Suggestion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        Rate the Passenger Experience
                        <span className="text-xs font-normal text-gray-400">(How was the passenger?)</span>
                      </label>
                      <div className="flex gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 w-fit">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setPassengerRating(star)}
                            className="focus:outline-none transition-all hover:scale-125"
                          >
                            <Star
                              className={`w-8 h-8 ${star <= passengerRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-200 fill-gray-100 hover:text-gray-300'
                                }`}
                            />
                          </button>
                        ))}
                        {passengerRating > 0 && (
                          <span className="ml-2 text-emerald-600 font-black self-center">{passengerRating}/5</span>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Additional Details</label>
                      <Textarea
                        placeholder="Write your feedback here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="rounded-2xl border-gray-100 bg-gray-50/50 min-h-[100px] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedTrip || !feedbackCategory || passengerRating === 0}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200/50 font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    Submit Journey Review
                  </Button>
                </form>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Avg Rating Card */}
              <Card className="p-6 rounded-3xl shadow-xl border-none bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  </div>
                  <p className="text-[11px] font-bold text-emerald-50 tracking-wide">Reputation Score</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black">{loading ? '—' : avgRating}</span>
                  <span className="text-emerald-200 text-sm font-bold opacity-60">/ 5.0</span>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <StarRow rating={Math.round(parseFloat(avgRating))} />
                  <p className="text-emerald-200 text-[10px] font-medium mt-2">Based on {feedback.length} journey reviews</p>
                </div>
              </Card>

              {/* Engagement Stats */}
              <div className="grid grid-cols-1 gap-4">
                <Card className="p-5 rounded-3xl shadow-sm border-gray-100 bg-white group hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <ThumbsUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-[11px] font-bold">Positive Vibes</p>
                      <p className="text-xl font-black text-gray-900">{loading ? '—' : positiveCount}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5 rounded-3xl shadow-sm border-gray-100 bg-white group hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-[11px] font-bold">Complaints</p>
                      <p className="text-xl font-black text-gray-900">{loading ? '—' : complaints}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Feedback List Container */}
          <Card className="rounded-2xl shadow-sm border-gray-100 bg-white overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Employee Feedback</h2>
                <p className="text-gray-500 text-sm mt-1">Direct reviews from your completed trips</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  {feedback.length} Reviews
                </span>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-gray-400 font-medium mt-4 text-sm  tracking-widest">Loading reviews...</p>
                </div>
              ) : feedback.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-gray-800 font-semibold">No feedback received yet</p>
                  <p className="text-gray-400 text-sm mt-1">Collect feedback by completing your assigned trips.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {feedback.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Employee Avatar */}
                          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-lg font-bold text-emerald-700">
                              {(item.employee_name || 'U')[0].toUpperCase()}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-gray-900 leading-tight">
                              {item.employee_name || 'Anonymous Employee'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-300" />
                                {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-gray-200 text-[10px]">•</span>
                              <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-300" />
                                {item.route_name || 'Direct Route'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 bg-gray-50/50 p-2 px-3 rounded-xl border border-gray-100">
                          <StarRow rating={item.rating} />
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${item.feedback_type === 'appreciation'
                            ? 'bg-green-100 text-green-700'
                            : item.feedback_type === 'complaint'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                            }`}>
                            {item.feedback_type}
                          </span>
                        </div>
                      </div>

                      {/* Feedback Message */}
                      {item.message && (
                        <div className="mt-4 pl-4 border-l-2 border-emerald-100">
                          <p className="text-gray-600 text-sm leading-relaxed italic">
                            "{item.message}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
