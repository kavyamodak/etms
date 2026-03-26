import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Bus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [emailExistsError, setEmailExistsError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setEmailExistsError('');

      // Check if email exists first
      const { exists } = await authAPI.checkEmail(email);
      if (!exists) {
        setEmailExistsError('This email is not registered in our database.');
        setIsLoading(false);
        return;
      }

      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      {/* Back to Home */}
      <button
        onClick={() => navigate('/login')}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Login</span>
      </button>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-6">
            <Bus className="w-8 h-8 text-white" />
            <h1 className="text-2xl text-white">TRANZO</h1>
          </div>
          <h2 className="text-gray-800 mb-2">Forgot Password</h2>
          <p className="text-gray-500">Reset your account password</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Check Your Email</h3>
            <p className="text-gray-600 mb-6">
              We've sent password reset instructions to <strong>{email}</strong> if it exists in our system.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl h-12 shadow-lg"
            >
              RETURN TO LOGIN
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-12 rounded-xl border-gray-300 bg-gray-50 placeholder:text-gray-400"
                required
              />
              {emailExistsError && (
                <p className="text-red-600 text-sm mt-1.5 font-bold animate-pulse">
                  ⚠️ {emailExistsError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl h-12 shadow-lg mt-4"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Sending Link...' : 'SEND RESET LINK'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
