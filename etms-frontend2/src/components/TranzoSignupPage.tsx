import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Shield, Bus, Mail, Phone as PhoneIcon, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useNotify } from '../context/NotificationContext';

export default function TranzoSignupPage() {
  const navigate = useNavigate();
  const { signup, verifyOTP, user } = useAuth();
  const notify = useNotify();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee' | 'driver'>('employee');
  const [isLoading, setIsLoading] = useState(false);

  // OTP Verification States
  const [requiresOTP, setRequiresOTP] = useState(() => sessionStorage.getItem('requiresOTP') === 'true');
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState(() => sessionStorage.getItem('registeredEmail') || '');

  const [validation, setValidation] = useState({
    firstName: { isValid: false, message: '' },
    lastName: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
    phone: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
    confirmPassword: { isValid: false, message: '' },
  });

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;
  const phoneRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    setValidation({
      firstName: {
        isValid: firstName.trim().length >= 2,
        message: firstName
          ? firstName.trim().length >= 2
            ? 'Valid first name'
            : 'First name must be at least 2 characters'
          : '',
      },
      lastName: {
        isValid: lastName.trim().length >= 2,
        message: lastName
          ? lastName.trim().length >= 2
            ? 'Valid last name'
            : 'Last name must be at least 2 characters'
          : '',
      },
      email: {
        isValid: emailRegex.test(email),
        message: email ? (emailRegex.test(email) ? 'Valid email' : 'Invalid email format') : '',
      },
      phone: {
        isValid: phoneRegex.test(phone),
        message: phone ? (phoneRegex.test(phone) ? 'Valid phone number' : 'Invalid phone number') : '',
      },
      password: {
        isValid: passwordRegex.test(password),
        message: password
          ? passwordRegex.test(password)
            ? 'Strong password'
            : 'Password must be 6+ chars with , lowercase, number, and symbol'
          : '',
      },
      confirmPassword: {
        isValid: confirmPassword === password && confirmPassword !== '',
        message: confirmPassword ? (confirmPassword === password ? 'Passwords match' : 'Passwords do not match') : '',
      },
    });
  }, [firstName, lastName, email, phone, password, confirmPassword]);

  // Handle OAuth errors
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'email_exists') {
      const msg = params.get('message') || 'Google account already in use';
      setValidation((prev) => ({
        ...prev,
        email: { isValid: false, message: msg },
      }));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const allValid = Object.values(validation).every((v) => v.isValid);
    if (!allValid) {
      const failedFields = Object.entries(validation)
        .filter(([_, v]) => !v.isValid && v.message)
        .map(([k, v]) => `${k}: ${v.message}`)
        .join(' · ');
      notify.warning(`Please fix validation errors: ${failedFields || 'All fields must be valid'}`, { duration: 7000 });
      return;
    }

    try {
      setIsLoading(true);
      const fullName = `${firstName} ${lastName}`.trim();
      const res = await signup({ fullName, email, phone, password, role });

      // Stop here and show OTP screen if backend requires it.
      if (res?.requiresOTP) {
        setRegisteredEmail(res.email);
        setRequiresOTP(true);
        sessionStorage.setItem('requiresOTP', 'true');
        sessionStorage.setItem('registeredEmail', res.email);
        return;
      }

      // Fallback routing if OTP is globally bypassed
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'driver') {
        sessionStorage.setItem('userFullName', fullName);
        sessionStorage.setItem('userPhone', phone);
        sessionStorage.setItem('needsOnboarding', '1');
        sessionStorage.setItem('onboardingRole', 'driver');
        sessionStorage.setItem('userEmail', email);
        navigate('/driver-details', { replace: true });
      } else {
        sessionStorage.setItem('userFullName', fullName);
        sessionStorage.setItem('userPhone', phone);
        sessionStorage.setItem('needsOnboarding', '1');
        sessionStorage.setItem('onboardingRole', 'employee');
        sessionStorage.setItem('userEmail', email);
        navigate('/employee-details', { replace: true });
      }
    } catch (err: any) {
      if (err.message.includes('already')) {
        setValidation((prev) => ({
          ...prev,
          email: { isValid: false, message: 'Email already registered' },
        }));
      } else {
        notify.error(`Signup failed: ${err.message}`, { duration: 7000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      notify.warning('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsLoading(true);

      const res = await verifyOTP(registeredEmail, otp);

      // Navigate based on verified role
      const fullName = `${firstName} ${lastName}`.trim();
      const verifiedRole = res.role || role;

      if (verifiedRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (verifiedRole === 'driver') {
        sessionStorage.setItem('userFullName', fullName);
        sessionStorage.setItem('userPhone', phone);
        sessionStorage.setItem('needsOnboarding', '1');
        sessionStorage.setItem('onboardingRole', 'driver');
        sessionStorage.setItem('userEmail', registeredEmail);
        navigate('/driver-details', { replace: true });
      } else {
        sessionStorage.setItem('userFullName', fullName);
        sessionStorage.setItem('userPhone', phone);
        sessionStorage.setItem('needsOnboarding', '1');
        sessionStorage.setItem('onboardingRole', 'employee');
        sessionStorage.setItem('userEmail', registeredEmail);
        sessionStorage.removeItem('requiresOTP');
        sessionStorage.removeItem('registeredEmail');
        navigate('/employee-details', { replace: true });
      }
    } catch (err: any) {
      notify.error(err.message || 'OTP Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    sessionStorage.setItem('oauthInProgress', '1');
    authAPI.googleLogin(role, 'signup');
  };

  if (requiresOTP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-gray-800 mb-2">Verify Your Account</h2>
            <p className="text-gray-500 text-sm">Enter the 6-digit OTP from the backend terminal logs for <br /><span className="font-semibold text-gray-700">{registeredEmail}</span></p>
          </div>

          {/* No inline error — toasts handle errors */}

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="pl-12 h-14 text-center text-2xl tracking-[0.5em] rounded-xl border-gray-300 bg-gray-50 placeholder:text-gray-300 font-semibold"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl h-12 shadow-lg"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'VERIFY OTP'}
            </Button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Didn't receive the code?{' '}
            <button
              type="button"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
              onClick={() => {
                notify.info('A new code would be resent in a fully implemented system. Please check the server console logs for now.');
              }}
            >
              Resend Code
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-6">
            <Bus className="w-8 h-8 text-white" />
            <h1 className="text-2xl text-white">TRANZO</h1>
          </div>
          <h2 className="text-gray-800 mb-2">Create Account</h2>
          <p className="text-gray-500">Sign up to get started</p>
        </div>

        {/* No inline banner — errors shown as toasts */}

        <Button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl h-12 flex items-center justify-center gap-3 transition-colors shadow-sm mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative my-6 mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 placeholder:text-gray-400 transition-all ${firstName
                  ? validation.firstName.isValid
                    ? 'border-emerald-500'
                    : 'border-red-500'
                  : 'border-gray-300'
                  }`}
                required
              />
              {firstName && validation.firstName.message && (
                <p className={`text-xs mt-1 ml-1 ${validation.firstName.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                  {validation.firstName.message}
                </p>
              )}
            </div>

            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 placeholder:text-gray-400 transition-all ${lastName
                  ? validation.lastName.isValid
                    ? 'border-emerald-500'
                    : 'border-red-500'
                  : 'border-gray-300'
                  }`}
                required
              />
              {lastName && validation.lastName.message && (
                <p className={`text-xs mt-1 ml-1 ${validation.lastName.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                  {validation.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 placeholder:text-gray-400 transition-all ${email || validation.email.message ? (validation.email.isValid ? 'border-emerald-500' : 'border-red-500') : 'border-gray-300'
                }`}
              required
            />
            {validation.email.message && (
              <p className={`text-xs mt-1 ml-1 ${validation.email.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                {validation.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="relative">
            <PhoneIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
            <Input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 placeholder:text-gray-400 transition-all ${phone ? (validation.phone.isValid ? 'border-emerald-500' : 'border-red-500') : 'border-gray-300'
                }`}
              required
            />
            {phone && validation.phone.message && (
              <p className={`text-xs mt-1 ml-1 ${validation.phone.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                {validation.phone.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 placeholder:text-gray-400 transition-all ${password ? (validation.password.isValid ? 'border-emerald-500' : 'border-red-500') : 'border-gray-300'
                }`}
              required
            />
            {password && validation.password.message && (
              <p className={`text-xs mt-1 ml-1 ${validation.password.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                {validation.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 placeholder:text-gray-400 transition-all ${confirmPassword ? (validation.confirmPassword.isValid ? 'border-emerald-500' : 'border-red-500') : 'border-gray-300'
                }`}
              required
            />
            {confirmPassword && validation.confirmPassword.message && (
              <p
                className={`text-xs mt-1 ml-1 ${validation.confirmPassword.isValid ? 'text-emerald-600' : 'text-red-600'
                  }`}
              >
                {validation.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-3">
            <label className="block text-gray-700 text-sm">Select Role</label>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${role === 'admin'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Shield className="w-4 h-4" /> Admin
              </Button>
              <Button
                type="button"
                onClick={() => setRole('driver')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${role === 'driver'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Driver
              </Button>
              <Button
                type="button"
                onClick={() => setRole('employee')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${role === 'employee'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Employee
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full mt-4 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
            {isLoading ? 'Processing...' : 'Sign Up with Email'}
          </Button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8">
          Already have an account?{' '}
          <span className="text-emerald-500 font-medium cursor-pointer flex items-center justify-center gap-1 mt-1" onClick={() => navigate('/login')}>
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </span>
        </p>
      </div>
    </div>
  );
}
