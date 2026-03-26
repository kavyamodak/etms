import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, Bus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { authAPI } from '../services/api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (!token) {
            setError('Invalid or missing reset token. Please request a new link.');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            await authAPI.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
            {/* Back to Home */}
            <button
                onClick={() => navigate('/')}
                className="fixed top-4 left-4 z-50 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
            </button>

            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-12">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-6">
                        <Bus className="w-8 h-8 text-white" />
                        <h1 className="text-2xl text-white">TRANZO</h1>
                    </div>
                    <h2 className="text-gray-800 mb-2">Reset Password</h2>
                    <p className="text-gray-500">Enter your new password below</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {success ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-800 mb-2">Password Reset Complete</h3>
                        <p className="text-gray-600 mb-6">Your password has been successfully updated.</p>
                        <p className="text-sm text-gray-500">Redirecting to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="password"
                                placeholder="NEW PASSWORD"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-12 h-12 rounded-xl border-gray-300 bg-gray-50 placeholder:text-gray-400"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="password"
                                placeholder="CONFIRM NEW PASSWORD"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-12 h-12 rounded-xl border-gray-300 bg-gray-50 placeholder:text-gray-400"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl h-12 shadow-lg mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? '⏳ Updating...' : 'RESET PASSWORD'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
