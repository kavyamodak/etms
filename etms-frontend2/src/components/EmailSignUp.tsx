import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function EmailSignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleContinueWithEmail = (e: React.FormEvent) => {
    e.preventDefault();
    // Store email in session storage for later use
    sessionStorage.setItem('userEmail', email);
    navigate('/employee-details');
  };

  const handleGoogleLogin = () => {
    // Set OAuth flag to track this is a fresh OAuth initiation
    sessionStorage.setItem('oauthInProgress', '1');
    
    // Initiate Google OAuth
    authAPI.googleLogin('employee');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8eef3] p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 md:p-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-gray-800 mb-2">Welcome to ETMS</h1>
          <p className="text-gray-500">Sign up to get started</p>
        </div>

        {/* Google Sign Up Button */}
        <Button
          type="button"
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full h-12 rounded-lg border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 mb-6 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </Button>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleContinueWithEmail} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="email"
              placeholder="EMAIL ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50 placeholder:text-gray-400"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full h-12 shadow-md"
          >
            CONTINUE WITH EMAIL
          </Button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-gray-400 mt-8 text-sm">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-gray-600 hover:text-gray-800"
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
