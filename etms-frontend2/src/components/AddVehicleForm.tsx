import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Car, Hash, Users, CheckCircle2, AlertCircle, ArrowLeft,
    Wrench, Tag, LayoutDashboard, UserCog, Route, TrendingUp,
    CreditCard, FileText, LogOut, Menu, Gauge,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import { Card } from './ui/card';
import TranzoLogo from './TranzoLogo';
import { vehicleAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Inline validation helper ──────────────────────────────────────
const plateRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

function ValidatedInput({
    icon: Icon, placeholder, value, onChange, valid, message, type = 'text', min, max,
}: {
    icon: React.ElementType;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    valid: boolean | null; // null = untouched
    message: string;
    type?: string;
    min?: string;
    max?: string;
}) {
    const touched = value.length > 0;
    const borderClass = !touched
        ? 'border-gray-300'
        : valid
            ? 'border-emerald-500'
            : 'border-red-500';

    return (
        <div className="relative">
            <Icon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
            <Input
                type={type}
                placeholder={placeholder}
                value={value}
                min={min}
                max={max}
                onChange={(e) => onChange(e.target.value)}
                className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 ${borderClass}`}
            />
            {touched && (
                <div className={`absolute right-3 top-3.5 ${valid ? 'text-emerald-600' : 'text-red-600'}`}>
                    {valid ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
            )}
            {touched && message && (
                <p className={`text-xs mt-1 ${valid ? 'text-emerald-600' : 'text-red-600'}`}>{message}</p>
            )}
        </div>
    );
}

export default function AddVehicleForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const editData = location.state?.editData;

    const { logout, user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Form fields
    const [vehicleNumber, setVehicleNumber] = useState(editData?.number || '');
    const [vehicleType, setVehicleType] = useState(editData?.type || '');
    const [make, setMake] = useState(editData?.model?.split(' ')[0] || '');
    const [model, setModel] = useState(editData?.model?.split(' ').slice(1).join(' ') || '');
    const [year, setYear] = useState('');
    const [capacity, setCapacity] = useState(editData?.capacity?.toString() || '');
    const [status, setStatus] = useState(editData?.status || 'active');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

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
        window.location.href = '/login';
    };

    // ── Validation ────────────────────────────────────────────────
    const plateValid = vehicleNumber ? plateRegex.test(vehicleNumber.toUpperCase()) : null;
    const plateMsg = plateValid === false ? 'Format: MH12AB1234' : plateValid ? 'Valid plate number' : '';

    const makeValid = make ? make.trim().length >= 2 : null;
    const makeMsg = makeValid === false ? 'Make must be at least 2 characters' : makeValid ? 'Valid make' : '';

    const modelValid = model ? model.trim().length >= 1 : null;
    const modelMsg = modelValid === false ? 'Model is required' : modelValid ? 'Valid model' : '';

    const yearNum = parseInt(year);
    const yearValid = year ? (yearNum >= 1990 && yearNum <= new Date().getFullYear() + 1) : null;
    const yearMsg = yearValid === false ? `Year must be between 1990 and ${new Date().getFullYear() + 1}` : yearValid ? 'Valid year' : '';

    const capNum = parseInt(capacity);
    const capValid = capacity ? (capNum >= 1 && capNum <= 60) : null;
    const capMsg = capValid === false ? 'Capacity must be 1–60' : capValid ? 'Valid capacity' : '';

    const typeValid = vehicleType.length > 0;

    const allValid = plateValid && makeValid && modelValid && yearValid && capValid && typeValid;

    // ── Submit ───────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allValid) {
            setSubmitError('Please fill in all fields correctly before submitting.');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        try {
            const payload = {
                vehicle_number: vehicleNumber.toUpperCase(),
                vehicle_type: vehicleType,
                make: make.trim(),
                model: model.trim(),
                year: yearNum,
                capacity: capNum,
                status,
            };

            if (editData) {
                await vehicleAPI.update(editData.id, payload);
            } else {
                await vehicleAPI.create(payload);
            }

            setSubmitSuccess(true);
            setTimeout(() => navigate('/admin/vehicles', { replace: true }), 1200);
        } catch (err: any) {
            setSubmitError(err?.message || 'Failed to add vehicle. Please try again.');
        } finally {
            setSubmitting(false);
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
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.id === 'vehicles'
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
                            <div className="flex-1">
                                <p className="text-white font-medium text-sm">{user?.full_name || 'Admin'}</p>
                                <p className="text-emerald-200 text-xs">{user?.email || 'admin@company.com'}</p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleLogout} className="w-full flex items-center gap-3 bg-red-500 hover:bg-red-600 rounded-xl">
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-64">
                {/* Mobile header */}
                <div className="lg:hidden bg-white shadow-sm p-4 flex items-center gap-3">
                    <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu className="w-6 h-6" />
                    </Button>
                    <TranzoLogo size="small" showText={false} />
                </div>

                <div className="p-6">
                    <div className="max-w-2xl mx-auto">
                        {/* Back button */}
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/vehicles')}
                            className="mb-6 text-gray-600 hover:text-gray-800"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Vehicles
                        </Button>

                        <Card className="p-0 rounded-2xl overflow-hidden shadow-xl border-emerald-100">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Car className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-white text-xl font-semibold">{editData ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>
                                        <p className="text-emerald-100 text-sm">{editData ? 'Update vehicle details' : 'Fill in the details to register a vehicle to the fleet'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {/* Success banner */}
                                {submitSuccess && (
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        Vehicle {editData ? 'updated' : 'added'} successfully! Redirecting…
                                    </div>
                                )}

                                {/* Error banner */}
                                {submitError && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {submitError}
                                    </div>
                                )}

                                {/* Row 1: Plate + Vehicle Type */}
                                <div className="grid md:grid-cols-2 gap-5">
                                    <ValidatedInput
                                        icon={Hash}
                                        placeholder="Plate Number (e.g. MH12AB1234)"
                                        value={vehicleNumber}
                                        onChange={(v) => setVehicleNumber(v.toUpperCase())}
                                        valid={plateValid}
                                        message={plateMsg}
                                    />
                                    <div>
                                        <Select value={vehicleType} onValueChange={setVehicleType}>
                                            <SelectTrigger className={`h-12 rounded-xl border-2 bg-gray-50 ${vehicleType ? 'border-emerald-500' : 'border-gray-300'}`}>
                                                <div className="flex items-center gap-2">
                                                    <Car className="w-4 h-4 text-gray-400" />
                                                    <SelectValue placeholder="Vehicle Type" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sedan">Sedan</SelectItem>
                                                <SelectItem value="suv">SUV</SelectItem>
                                                <SelectItem value="mini-bus">Mini Bus</SelectItem>
                                                <SelectItem value="bus">Bus</SelectItem>
                                                <SelectItem value="van">Van</SelectItem>
                                                <SelectItem value="tempo">Tempo Traveller</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {!typeValid && vehicleType === '' && (
                                            <p className="text-xs mt-1 text-gray-400">Select a vehicle type</p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Make + Model */}
                                <div className="grid md:grid-cols-2 gap-5">
                                    <ValidatedInput
                                        icon={Tag}
                                        placeholder="Make (e.g. Toyota)"
                                        value={make}
                                        onChange={setMake}
                                        valid={makeValid}
                                        message={makeMsg}
                                    />
                                    <ValidatedInput
                                        icon={Wrench}
                                        placeholder="Model (e.g. Innova Crysta)"
                                        value={model}
                                        onChange={setModel}
                                        valid={modelValid}
                                        message={modelMsg}
                                    />
                                </div>

                                {/* Row 3: Year + Capacity */}
                                <div className="grid md:grid-cols-2 gap-5">
                                    <ValidatedInput
                                        icon={Gauge}
                                        placeholder="Year (e.g. 2022)"
                                        value={year}
                                        onChange={setYear}
                                        valid={yearValid}
                                        message={yearMsg}
                                        type="number"
                                        min="1990"
                                        max={String(new Date().getFullYear() + 1)}
                                    />
                                    <ValidatedInput
                                        icon={Users}
                                        placeholder="Passenger Capacity (1–60)"
                                        value={capacity}
                                        onChange={setCapacity}
                                        valid={capValid}
                                        message={capMsg}
                                        type="number"
                                        min="1"
                                        max="60"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="h-12 rounded-xl border-2 border-emerald-500 bg-gray-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="maintenance">Under Maintenance</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={submitting || submitSuccess}
                                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl h-12 shadow-lg disabled:opacity-60"
                                    >
                                        {submitting ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                                Saving…
                                            </span>
                                        ) : (
                                            editData ? 'Update Vehicle' : 'Add Vehicle'
                                        )}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => navigate('/admin/vehicles')} className="rounded-xl h-12 px-6">
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>

            {sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}
        </div>
    );
}
