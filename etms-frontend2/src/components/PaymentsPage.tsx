import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, Route, CreditCard, FileText, LogOut,
  Menu, X, TrendingUp, UserCog, BarChart3, ChevronRight, Search,
  ArrowLeft, IndianRupee, CheckCircle, Clock, XCircle, Loader2,
  Shield, Lock, Download, Eye, EyeOff, Star, Phone, MapPin,
  TruckIcon, Calendar, RefreshCw,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../context/AuthContext';
import TranzoLogo from './TranzoLogo';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table';
import { paymentAPI, driverAPI, razorpayAPI } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
type Step = 'list' | 'driver-detail' | 'processing' | 'success' | 'history';

interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  vehicle_number: string;
  vehicle_type: string;
  status: string;
  total_trips: number;
  rating: string | number;
  earnings: string | number;
  license_number: string;
}

interface CompletedPayout {
  id: number;
  recipient_name: string;
  recipient_type?: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string;
  description: string;
  created_at: string;
  vehicle_number: string;
  processed_by_name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    success: 'Successful', pending: 'Pending', processing: 'Processing', failed: 'Failed',
  };
  return (
    <span className={`px-3 py-1 rounded-full inline-block text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function formatCard(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Flow state
  const [step, setStep] = useState<Step>('list');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payouts, setPayouts] = useState<CompletedPayout[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [completedPayout, setCompletedPayout] = useState<CompletedPayout | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<CompletedPayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Payout form
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [formError, setFormError] = useState('');

  // Processing animation & Order state
  const [processingDone, setProcessingDone] = useState(false);
  const processingTimerRef = useRef<any>(null);

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

  // ─── Load data ──────────────────────────────────────────────────────────────
  const loadDrivers = useCallback(async () => {
    try {
      const driversRes = await driverAPI.getAll().catch(() => []);
      const normalized = (Array.isArray(driversRes) ? driversRes : []).map((d: any) => ({
        id: d.id,
        name: d.full_name || d.name || 'Unknown',
        email: d.email || '',
        phone: d.phone || '',
        vehicle_number: d.vehicle_number || 'No Vehicle',
        vehicle_type: d.vehicle_type || '',
        status: d.status || 'active',
        total_trips: d.total_trips || 0,
        rating: d.rating || d.average_rating || '5.00',
        earnings: d.earnings || 0,
        license_number: d.license_number || '',
      }));
      setDrivers(normalized);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayouts = useCallback(async () => {
    const res = await paymentAPI.getHistory().catch(() => ({ success: false, payouts: [] }));
    if (res.success) setPayouts(res.payouts || []);
  }, []);

  useEffect(() => { loadDrivers(); loadPayouts(); }, [loadDrivers, loadPayouts]);

  // Auto-refresh when on history tab
  useEffect(() => {
    if (step !== 'history') return;
    const iv = setInterval(() => loadPayouts(), 5000);
    return () => clearInterval(iv);
  }, [step, loadPayouts]);

  const handleRazorpayPayout = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setFormError('Please enter a valid payout amount');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      // 1. Create Razorpay Order
      const order = await razorpayAPI.createOrder(parseFloat(amount), 'INR');
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'TRANZO',
        description: `Payout to ${selectedDriver?.name}`,
        order_id: order.order_id,
        handler: async (response: any) => {
          console.log('--- Razorpay Payout Response ---', response);
          setStep('processing');
          setProcessingDone(false);
          
          try {
            // 2. Verify Payment & Record Payout
            const verify = await razorpayAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id || order.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verify.success) {
              // 3. Initiate the payout recording on backend
              const payout = await paymentAPI.initiatePayout({
                recipient_id: selectedDriver!.id,
                recipient_type: 'driver',
                amount: parseFloat(amount),
                currency: 'inr',
                description: description,
                transaction_id: response.razorpay_payment_id
              });

              setCompletedPayout({
                id: payout.payout?.id || 0,
                recipient_name: selectedDriver?.name || 'Unknown',
                amount: parseFloat(amount),
                currency: 'inr',
                status: 'success',
                transaction_id: response.razorpay_payment_id,
                description: description,
                created_at: new Date().toISOString(),
                vehicle_number: selectedDriver?.vehicle_number || '—',
                processed_by_name: user?.full_name || 'Admin',
              });
              
              setProcessingDone(true);
              loadPayouts();
              setTimeout(() => setStep('success'), 1500);
            } else {
              setFormError('Payment verification failed');
              setStep('driver-detail');
            }
          } catch (err: any) {
            setFormError(err.message || 'Verification failed');
            setStep('driver-detail');
          }
        },
        prefill: {
          name: user?.full_name || 'Admin',
          email: user?.email || '',
        },
        theme: { color: '#059669' },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setFormError(err.message || 'Failed to initialize payout');
      setLoading(false);
    }
  };

  // Stripe Success handler removed - now handled by Razorpay callback

  useEffect(() => () => { if (processingTimerRef.current) clearTimeout(processingTimerRef.current); }, []);

  // ─── Step handlers ──────────────────────────────────────────────────────────
  const handleSelectDriver = (d: Driver) => {
    setSelectedDriver(d);
    setAmount('');
    setDescription('');
    setCardNumber('');
    setCardName('');
    setExpiry('');
    setCvv('');
    setFormError('');
    setStep('driver-detail');
  };

  const handleProceedToConfirm = () => {
    handleRazorpayPayout();
  };

  const handleExportReceipt = () => {
    if (!completedPayout) return;
    const lines = [
      'TRANZO ENTERPRISE MOBILITY — PAYMENT RECEIPT',
      '='.repeat(50),
      `Transaction ID : ${completedPayout.id}`,
      `Payment Ref    : ${completedPayout.transaction_id || 'Processing…'}`,
      `Recipient      : ${completedPayout.recipient_name}`,
      `Vehicle        : ${completedPayout.vehicle_number}`,
      `Amount         : $${parseFloat(String(completedPayout.amount)).toFixed(2)} USD`,
      `Status         : ${completedPayout.status.toUpperCase()}`,
      `Description    : ${completedPayout.description || '—'}`,
      `Processed By   : ${completedPayout.processed_by_name}`,
      `Date           : ${new Date(completedPayout.created_at).toLocaleString('en-IN')}`,
      '='.repeat(50),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `receipt_${completedPayout.id}.txt`;
    a.click();
  };

  const handleLogout = () => { logout(); window.location.href = '/login'; };

  const filteredDrivers = drivers.filter(d => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return d.name.toLowerCase().includes(t) || d.vehicle_number.toLowerCase().includes(t);
  });

  // ─── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-emerald-700 to-teal-700 text-white w-64 transform transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl`}>
      <div className="p-6 border-b border-emerald-600">
        <TranzoLogo size="medium" showText={true} />
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          const active = item.id === 'payments';
          return (
            <button key={item.id} onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-white text-emerald-700 shadow-lg' : 'text-emerald-100 hover:bg-emerald-600'}`}>
              <Icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
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
              <p className="text-white font-semibold text-sm truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-emerald-200 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <Button onClick={handleLogout} className="w-full flex items-center gap-3 bg-red-500 hover:bg-red-600 rounded-xl">
          <LogOut className="w-5 h-5" /><span>Logout</span>
        </Button>
      </div>
    </aside>
  );

  // ─── Top Bar ────────────────────────────────────────────────────────────────
  const stepTitles: Record<Step, { title: string; sub: string }> = {
    'list': { title: 'Payments & Payouts', sub: 'Select a driver to send a payout' },
    'driver-detail': { title: 'Driver Details', sub: `Reviewing ${selectedDriver?.name || ''}` },
    'processing': { title: 'Processing Payout', sub: 'Updating ledger and records' },
    'success': { title: 'Payment Successful', sub: 'Transfer completed' },
    'history': { title: 'Transaction History', sub: 'Full payout log' },
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Sidebar />

      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                {sidebarOpen ? <X /> : <Menu />}
              </Button>
              {/* Breadcrumb back button */}
              {step === 'driver-detail' && (
                <button onClick={() => { setFormError(''); setStep('list'); }}
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {step === 'history' && (
                <button onClick={() => setStep('list')}
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-800">{stepTitles[step].title}</h1>
                <p className="text-gray-500 text-sm mt-0.5">{stepTitles[step].sub}</p>
              </div>
            </div>
            {/* Progress indicator */}
            {(step === 'list' || step === 'driver-detail') && (
              <div className="hidden md:flex items-center gap-2">
                {(['list', 'driver-detail'] as Step[]).map((s, i) => {
                  const active = s === step;
                  const done = ['list', 'driver-detail'].indexOf(step) > i;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${done ? 'bg-emerald-500 text-white' : active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      {i < 1 && <div className={`w-8 h-0.5 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                    </div>
                  );
                })}
              </div>
            )}
            {step === 'list' && (
              <button onClick={() => { loadPayouts(); setStep('history'); }}
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-500 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-colors">
                <FileText className="w-4 h-4" />Transaction History
              </button>
            )}
          </div>
        </header>

        <main className="p-6 space-y-6">

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STEP 1 — DRIVER LIST                                              */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {step === 'list' && (
            <>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search drivers by name or vehicle…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                />
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
                  <p className="text-gray-400 text-sm">Loading drivers…</p>
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <UserCog className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No drivers found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredDrivers.map(d => (
                    <Card key={d.id}
                      className="p-6 rounded-2xl shadow-lg border-none bg-white hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] group"
                      onClick={() => handleSelectDriver(d)}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <span className="text-emerald-700 font-bold text-lg">{d.name[0]?.toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{d.name}</p>
                            <p className="text-gray-400 text-xs truncate">{d.license_number || 'DL—'}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {d.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <TruckIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{d.vehicle_number}{d.vehicle_type ? ` · ${d.vehicle_type}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Star className="w-4 h-4 text-yellow-400 shrink-0" />
                          <span>{parseFloat(String(d.rating)).toFixed(1)} rating · {d.total_trips} trips</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <IndianRupee className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>Earnings: <strong>{fmt(parseFloat(String(d.earnings)))}</strong></span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-emerald-600 text-sm font-medium">Send Payout</span>
                        <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STEP 2 — DRIVER DETAIL + AMOUNT                                   */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {step === 'driver-detail' && selectedDriver && (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Driver Profile Card */}
              <Card className="p-6 rounded-2xl shadow-lg border-none bg-white">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="text-emerald-700 font-black text-2xl">{selectedDriver.name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800">{selectedDriver.name}</h2>
                    <p className="text-gray-500 text-sm">{selectedDriver.license_number || 'License not set'}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {[
                        { icon: TruckIcon, label: 'Vehicle', val: selectedDriver.vehicle_number },
                        { icon: Star, label: 'Rating', val: `${parseFloat(String(selectedDriver.rating)).toFixed(1)} / 5.0` },
                        { icon: TrendingUp, label: 'Total Trips', val: String(selectedDriver.total_trips) },
                        { icon: IndianRupee, label: 'Lifetime Earnings', val: fmt(parseFloat(String(selectedDriver.earnings))) },
                        ...(selectedDriver.phone ? [{ icon: Phone, label: 'Phone', val: selectedDriver.phone }] : []),
                        ...(selectedDriver.email ? [{ icon: MapPin, label: 'Email', val: selectedDriver.email }] : []),
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                              <p className="text-gray-400 text-xs">{item.label}</p>
                              <p className="text-gray-700 text-sm font-medium">{item.val}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payout Amount */}
              <Card className="p-6 rounded-2xl shadow-lg border-none bg-white">
                <h3 className="font-semibold text-gray-800 mb-1">Payout Amount</h3>
                <p className="text-gray-500 text-sm mb-5">Enter the amount in ₹ to transfer to {selectedDriver.name}</p>

                {formError && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{formError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (INR)</label>
                    <div className="flex items-center border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent overflow-hidden">
                      <span className="flex items-center justify-center px-4 bg-gray-50 border-r border-gray-200 h-full py-3">
                        <IndianRupee className="w-5 h-5 text-gray-500" />
                      </span>
                      <input
                        type="number" placeholder="0.00" min={1} max={10000} step="0.01"
                        value={amount} onChange={e => { setAmount(e.target.value); setFormError(''); }}
                        className="flex-1 px-4 py-3 text-lg font-semibold text-gray-800 focus:outline-none bg-white"
                      />
                    </div>
                    <p className="text-gray-400 text-xs mt-1">Min: ₹1.00 · Max: ₹10,000.00</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text" placeholder="e.g. March 2026 salary"
                      value={description} onChange={e => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </Card>

              <Button onClick={handleProceedToConfirm}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-semibold text-base flex items-center gap-2 justify-center">
                Continue to Payment <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STEP 3 — CARD DETAILS / CONFIRM                                   */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* Stripe Confirmation step removed in favor of direct Razorpay modal */}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STEP 4 — PROCESSING ANIMATION                                     */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-sm">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  {/* Outer spinning ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                  {/* Inner pulsing circle */}
                  <div className="absolute inset-3 rounded-full bg-emerald-50 animate-pulse flex items-center justify-center">
                    {processingDone
                      ? <CheckCircle className="w-10 h-10 text-emerald-500" />
                      : <CreditCard className="w-10 h-10 text-emerald-400" />}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {processingDone ? 'Transfer Complete!' : 'Processing Payment…'}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {processingDone
                    ? 'Payout has been processed successfully.'
                    : `Transferring ${fmt(parseFloat(amount))} to ${selectedDriver?.name} via Razorpay…`}
                </p>
                <div className="space-y-3">
                  {[
                    { label: 'Authorizing card', done: true },
                    { label: 'Verifying recipient', done: true },
                    { label: 'Processing via Stripe', done: processingDone },
                    { label: 'Confirming transfer', done: processingDone },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-500' : 'bg-gray-100'}`}>
                        {item.done
                          ? <CheckCircle className="w-3 h-3 text-white" />
                          : <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />}
                      </div>
                      <span className={item.done ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STEP 5 — SUCCESS RECEIPT                                          */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {step === 'success' && completedPayout && (
            <div className="max-w-xl mx-auto space-y-5">
              {/* Success Header */}
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Payment Sent!</h2>
                <p className="text-gray-500 mt-1">
                  {fmt(completedPayout.amount)} has been sent to {completedPayout.recipient_name}
                </p>
              </div>

              {/* Receipt Card */}
              <Card className="rounded-2xl shadow-lg border-none bg-white overflow-hidden">
                <div className="bg-emerald-600 px-6 py-4">
                  <p className="text-emerald-100 text-xs font-semibold  tracking-widest">Payment Receipt</p>
                  <p className="text-white text-2xl font-black mt-1">
                    {fmt(completedPayout.amount)} <span className="text-emerald-200 text-sm font-normal">INR</span>
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Transaction ID', val: `#${completedPayout.id}` },
                    { label: 'Payment Reference', val: completedPayout.transaction_id || 'Processing…' },
                    { label: 'Recipient', val: completedPayout.recipient_name },
                    { label: 'Vehicle', val: completedPayout.vehicle_number || '—' },
                    { label: 'Description', val: completedPayout.description || '—' },
                    { label: 'Processed By', val: completedPayout.processed_by_name },
                    { label: 'Date & Time', val: new Date(completedPayout.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500 text-sm">{row.label}</span>
                      <span className={`text-gray-800 text-sm font-medium text-right max-w-[60%] break-all ${row.label === 'Payment Reference' ? 'font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded' : ''}`}>
                        {row.val}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-500 text-sm">Status</span>
                    <StatusBadge status={completedPayout.status} />
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleExportReceipt} variant="outline"
                  className="flex items-center gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl h-11">
                  <Download className="w-4 h-4" />Download Receipt
                </Button>
                <Button onClick={() => { setStep('list'); setSelectedDriver(null); setCompletedPayout(null); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11">
                  New Payout
                </Button>
              </div>
              <button onClick={() => { setStep('history'); loadPayouts(); }}
                className="w-full text-center text-sm text-gray-400 hover:text-emerald-600 transition-colors py-2">
                View all transaction history →
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* HISTORY PAGE                                                       */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {step === 'history' && (
            <Card className="rounded-2xl shadow-lg border-none bg-white">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-gray-800 font-semibold text-lg">Transaction History</h2>
                  <p className="text-gray-500 text-sm mt-0.5">{payouts.length} total payouts</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={loadPayouts} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const headers = ['ID', 'Recipient', 'Vehicle', 'Amount', 'Currency', 'Razorpay ID', 'Description', 'Status', 'Date'];
                      const rows = payouts.map(p => [String(p.id), p.recipient_name, p.vehicle_number, fmt(Number(p.amount || 0)), (p.currency || 'inr').toUpperCase(), p.transaction_id || '', (p.description || '').replace(/,/g, ';'), p.status, p.created_at ? new Date(p.created_at).toLocaleDateString() : '']);
                      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `payouts.csv`; a.click();
                    }}
                    className="flex items-center gap-2 text-sm text-emerald-600 border border-emerald-500 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" />Export CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-500">No payouts yet. Create one to get started.</p>
                        </TableCell>
                      </TableRow>
                    ) : payouts.map(p => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-gray-50"
                        onClick={() => { setSelectedPayout(p); }}>
                        <TableCell>
                          <p className="font-medium text-gray-800">{p.recipient_name || '—'}</p>
                          <p className="text-xs text-gray-400 capitalize">{p.recipient_type}</p>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{p.vehicle_number || '—'}</TableCell>
                        <TableCell className="font-medium text-gray-800">{fmt(Number(p.amount || 0))}</TableCell>
                        <TableCell>
                          {p.transaction_id
                            ? <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{p.transaction_id}</span>
                            : <span className="text-xs text-gray-400 italic">pending…</span>}
                        </TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* ── Payout Detail Modal ──────────────────────────────────────────── */}
          {selectedPayout && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPayout(null)}>
              <Card className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="bg-emerald-600 px-6 py-5 flex items-start justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs font-semibold  tracking-widest">Payment Detail</p>
                    <p className="text-white text-2xl font-black mt-1">{fmt(Number(selectedPayout.amount))} <span className="text-emerald-200 text-sm font-normal">INR</span></p>
                  </div>
                  <button onClick={() => setSelectedPayout(null)} className="text-emerald-200 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Transaction ID', val: `#${selectedPayout.id}` },
                    { label: 'Payment Reference', val: selectedPayout.transaction_id || 'Processing…', mono: true },
                    { label: 'Recipient', val: selectedPayout.recipient_name || '—' },
                    { label: 'Vehicle', val: selectedPayout.vehicle_number || '—' },
                    { label: 'Description', val: selectedPayout.description || '—' },
                    { label: 'Processed By', val: selectedPayout.processed_by_name || 'Admin' },
                    { label: 'Date', val: selectedPayout.created_at ? new Date(selectedPayout.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500 text-sm shrink-0">{row.label}</span>
                      <span className={`text-gray-800 text-sm font-medium text-right max-w-[60%] break-all ${'mono' in row && row.mono ? 'font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded' : ''}`}>
                        {row.val}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-500 text-sm">Status</span>
                    <StatusBadge status={selectedPayout.status} />
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <Button
                    onClick={() => {
                      const lines = [`TRANZO RECEIPT\n`, `Transaction #${selectedPayout.id}\n`, `Recipient: ${selectedPayout.recipient_name}\n`, `Amount: ${fmt(Number(selectedPayout.amount))}\n`, `Status: ${selectedPayout.status}\n`, `Razorpay ID: ${selectedPayout.transaction_id || 'Processing'}\n`, `Date: ${new Date(selectedPayout.created_at).toLocaleString('en-IN')}`];
                      const blob = new Blob([lines.join('')], { type: 'text/plain' });
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `receipt_${selectedPayout.id}.txt`; a.click();
                    }}
                    variant="outline"
                    className="w-full flex items-center gap-2 justify-center border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                  >
                    <Download className="w-4 h-4" />Download Receipt
                  </Button>
                </div>
              </Card>
            </div>
          )}

        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
