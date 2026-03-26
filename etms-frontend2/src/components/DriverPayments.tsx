import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Route as RouteIcon, Calendar, Car, MessageSquare,
    LogOut, Menu, X, CreditCard, RefreshCw, DollarSign,
    CheckCircle, Clock, XCircle, Loader2, TrendingUp, Wallet,
    Download, ChevronRight, ArrowLeft, UserCog,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import TranzoLogo from './TranzoLogo';
import { paymentAPI } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
type View = 'list' | 'detail';

interface Payout {
    id: number;
    amount: string | number;
    currency: string;
    status: string;
    stripe_transfer_id: string;
    description: string;
    created_at: string;
    processed_by_name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function getInitials(fullName?: string, fallback?: string) {
    const raw = (fullName || fallback || '').trim();
    if (!raw) return 'U';
    const parts = raw.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) || '';
    return (first + last).toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        success: 'bg-green-100 text-green-700',
        pending: 'bg-amber-100 text-amber-700',
        processing: 'bg-blue-100 text-blue-700',
        failed: 'bg-red-100 text-red-700',
    };
    const icons: Record<string, typeof CheckCircle> = {
        success: CheckCircle, pending: Clock, processing: Loader2, failed: XCircle,
    };
    const labels: Record<string, string> = {
        success: 'Received', pending: 'Pending', processing: 'Processing', failed: 'Failed',
    };
    const Icon = icons[status] ?? Clock;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>
            <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
            {labels[status] ?? status}
        </span>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function DriverPayments() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [view, setView] = useState<View>('list');
    const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const initials = getInitials(user?.full_name, user?.email);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/driver' },
        { id: 'routes', label: 'Assigned Routes', icon: RouteIcon, path: '/driver/routes' },
        { id: 'schedule', label: 'Pickup Status', icon: Calendar, path: '/driver/attendance' },
        { id: 'vehicle', label: 'Vehicle Details', icon: Car, path: '/driver/vehicle-details' },
        { id: 'payments', label: 'My Payments', icon: CreditCard, path: '/driver/payments' },
        { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/driver/feedback' },
    ];

    const fetchPayouts = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        setError('');
        try {
            const res = await paymentAPI.getMyDriverPayouts();
            if (res.success) {
                setPayouts(res.payouts || []);
                setSummary(res.summary || null);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load payment history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPayouts(); }, [fetchPayouts]);
    useEffect(() => {
        const iv = setInterval(() => fetchPayouts(true), 5000);
        return () => clearInterval(iv);
    }, [fetchPayouts]);

    const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

    const handleOpenDetail = (p: Payout) => {
        setSelectedPayout(p);
        setView('detail');
    };

    const handleDownloadReceipt = (p: Payout) => {
        const lines = [
            'TRANZO ENTERPRISE MOBILITY — PAYMENT RECEIPT',
            '='.repeat(48),
            `Transaction ID   : #${p.id}`,
            `Stripe Transfer  : ${p.stripe_transfer_id || 'Processing…'}`,
            `Amount           : ${fmt(parseFloat(String(p.amount)))} INR`,
            `Status           : ${p.status.toUpperCase()}`,
            `Description      : ${p.description || '—'}`,
            `Processed By     : ${p.processed_by_name || 'Admin'}`,
            `Date             : ${p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : '—'}`,
            '='.repeat(48),
        ].join('\n');
        const blob = new Blob([lines], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `payment_receipt_${p.id}.txt`;
        a.click();
    };

    const totalReceived = parseFloat(String(summary?.total_received || 0));
    const pendingAmount = parseFloat(String(summary?.pending_amount || 0));
    const successCount = summary?.success_payouts || 0;
    const totalCount = summary?.total_payouts || 0;

    // ─── Sidebar ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-emerald-700 to-teal-700 text-white w-64 transform transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl`}>
                <div className="p-6 border-b border-emerald-600">
                    <TranzoLogo size="medium" showText={true} />
                </div>
                <nav className="p-4 space-y-2">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button key={item.id} onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.id === 'payments' ? 'bg-white text-emerald-700 shadow-lg' : 'text-emerald-100 hover:bg-emerald-600'}`}>
                                <Icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
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
                    <Button onClick={handleLogout} className="w-full flex items-center gap-3 bg-red-500 hover:bg-red-600 rounded-xl">
                        <LogOut className="w-5 h-5" /><span>Logout</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-64">
                {/* Top Bar */}
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                                {sidebarOpen ? <X /> : <Menu />}
                            </Button>
                            {view === 'detail' && (
                                <button onClick={() => { setView('list'); setSelectedPayout(null); }}
                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {view === 'detail' ? 'Payment Detail' : 'My Payments'}
                                </h1>
                                {view === 'detail' && (
                                    <p className="text-gray-500 text-sm mt-0.5">Transaction #{selectedPayout?.id}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => fetchPayouts(true)} title="Refresh"
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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

                    {/* ══════════════════════════════════════════════════════════════════ */}
                    {/* LIST VIEW                                                          */}
                    {/* ══════════════════════════════════════════════════════════════════ */}
                    {view === 'list' && (
                        <>
                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                                    <XCircle className="w-5 h-5 shrink-0" /><span className="text-sm font-medium">{error}</span>
                                </div>
                            )}

                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="p-6 rounded-2xl shadow-lg border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-emerald-100 mb-1">Total Received</p>
                                            <h3 className="text-white mb-1">{loading ? '—' : fmt(totalReceived)}</h3>
                                            <p className="text-emerald-200">{successCount} successful payment{successCount !== 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                            <Wallet className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6 rounded-2xl shadow-lg border-none bg-white hover:shadow-xl transition-all cursor-pointer hover:scale-105" onClick={() => navigate('/driver/payments')}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-gray-500 mb-1">Pending</p>
                                            <h3 className="text-gray-800 mb-1">{loading ? '—' : fmt(pendingAmount)}</h3>
                                            <p className="text-gray-500">Awaiting confirmation</p>
                                        </div>
                                        <div className="bg-amber-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6 rounded-2xl shadow-lg border-none bg-white hover:shadow-xl transition-all cursor-pointer hover:scale-105" onClick={() => navigate('/driver/payments')}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-gray-500 mb-1">Total Payouts</p>
                                            <h3 className="text-gray-800 mb-1">{loading ? '—' : totalCount}</h3>
                                            <p className="text-gray-500">All time history</p>
                                        </div>
                                        <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                                            <TrendingUp className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Payments List */}
                            <Card className="rounded-2xl shadow-sm border-gray-100 bg-white overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                                        <p className="text-gray-500 text-sm mt-1">Click any payment to view full details</p>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full  tracking-wider">
                                        {payouts.length} Records
                                    </span>
                                </div>
                                <div className="p-6">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-16">
                                            <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                                            <p className="text-gray-400 font-medium mt-4 text-sm  tracking-widest">Loading payments...</p>
                                        </div>
                                    ) : payouts.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                                                <DollarSign className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-gray-800 font-bold">No payouts received yet</p>
                                            <p className="text-gray-400 text-sm mt-1">Payouts from admin will appear here once processed.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {payouts.map(p => (
                                                <div key={p.id}
                                                    onClick={() => handleOpenDetail(p)}
                                                    className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${p.status === 'success' ? 'bg-emerald-50' : p.status === 'failed' ? 'bg-red-50' : 'bg-blue-50'}`}>
                                                            {p.status === 'success'
                                                                ? <CheckCircle className="w-6 h-6 text-emerald-600" />
                                                                : p.status === 'failed'
                                                                    ? <XCircle className="w-6 h-6 text-red-500" />
                                                                    : <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">
                                                                {fmt(parseFloat(String(p.amount)))} <span className="text-gray-400 font-normal text-xs ">{(p.currency || 'INR').toUpperCase()}</span>
                                                            </p>
                                                            <p className="text-gray-500 text-sm mt-0.5">
                                                                {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                                                                {p.description ? ` · ${p.description}` : ''}
                                                            </p>
                                                            {p.stripe_transfer_id && (
                                                                <p className="text-xs font-mono text-gray-400 mt-1">{p.stripe_transfer_id}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <StatusBadge status={p.status} />
                                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </>
                    )}

                    {/* ══════════════════════════════════════════════════════════════════ */}
                    {/* DETAIL VIEW                                                        */}
                    {/* ══════════════════════════════════════════════════════════════════ */}
                    {view === 'detail' && selectedPayout && (
                        <div className="max-w-xl mx-auto space-y-5">
                            {/* Status Header */}
                            <div className="text-center py-8">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${selectedPayout.status === 'success' ? 'bg-emerald-100' : selectedPayout.status === 'failed' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                    {selectedPayout.status === 'success'
                                        ? <CheckCircle className="w-10 h-10 text-emerald-600" />
                                        : selectedPayout.status === 'failed'
                                            ? <XCircle className="w-10 h-10 text-red-500" />
                                            : <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {selectedPayout.status === 'success' ? 'Payment Received' : selectedPayout.status === 'failed' ? 'Payment Failed' : 'Payment Processing'}
                                </h2>
                                <p className="text-gray-500 mt-1">Transaction #{selectedPayout.id}</p>
                            </div>

                            {/* Receipt Card */}
                            <Card className="rounded-2xl shadow-lg border-none bg-white overflow-hidden">
                                <div className="bg-emerald-600 px-6 py-5">
                                    <p className="text-emerald-100 text-xs font-semibold  tracking-widest">Amount Received</p>
                                    <p className="text-white text-3xl font-black mt-1">
                                        {fmt(parseFloat(String(selectedPayout.amount)))}
                                        <span className="text-emerald-200 text-base font-normal ml-1">INR</span>
                                    </p>
                                </div>
                                <div className="p-6 space-y-4">
                                    {[
                                        { label: 'Transaction ID', val: `#${selectedPayout.id}` },
                                        { label: 'Stripe Transfer ID', val: selectedPayout.stripe_transfer_id || 'Processing…', mono: true },
                                        { label: 'Description', val: selectedPayout.description || '—' },
                                        { label: 'Processed By', val: selectedPayout.processed_by_name || 'Admin' },
                                        { label: 'Date & Time', val: selectedPayout.created_at ? new Date(selectedPayout.created_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) : '—' },
                                    ].map((row, i) => (
                                        <div key={i} className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
                                            <span className="text-gray-500 text-sm shrink-0">{row.label}</span>
                                            <span className={`text-gray-800 text-sm font-medium text-right max-w-[60%] break-all ${'mono' in row && row.mono ? 'font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded' : ''}`}>
                                                {row.val}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-gray-500 text-sm">Status</span>
                                        <StatusBadge status={selectedPayout.status} />
                                    </div>
                                </div>
                            </Card>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button onClick={() => handleDownloadReceipt(selectedPayout)} variant="outline"
                                    className="flex items-center gap-2 justify-center border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl h-11">
                                    <Download className="w-4 h-4" />Download Receipt
                                </Button>
                                <Button onClick={() => { setView('list'); setSelectedPayout(null); }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11">
                                    Back to Payments
                                </Button>
                            </div>

                            {selectedPayout.status === 'processing' && (
                                <p className="text-center text-sm text-gray-400">
                                    This payment is still processing. The page auto-refreshes every 5 seconds.
                                </p>
                            )}
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
