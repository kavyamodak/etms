import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';

export default function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Route based on selected role
    if (selectedRole === 'admin') {
      navigate('/admin');
    } 
    else if (selectedRole === 'user') {
      navigate('/user');
    }
    else {
      navigate('/driver');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8eef3] p-4">
      {/* Login Container */}
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl flex overflow-hidden min-h-[600px]">
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-white p-12 flex-col justify-center items-center relative">
          {/* Network Circuit Illustration */}
          <div className="relative w-full max-w-md">
            <svg className="w-full h-auto" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Main circuit paths */}
              <path d="M60 150 L120 150 L120 80 L180 80" stroke="#5B9BD5" strokeWidth="3" fill="none" />
              <path d="M180 80 L180 130 L240 130" stroke="#5B9BD5" strokeWidth="3" fill="none" />
              <path d="M120 150 L120 220 L180 220" stroke="#5B9BD5" strokeWidth="3" fill="none" />
              <path d="M240 130 L300 130 L300 180 L340 180" stroke="#5B9BD5" strokeWidth="3" fill="none" />
              <path d="M240 130 L240 200" stroke="#5B9BD5" strokeWidth="3" fill="none" />
              <path d="M180 220 L240 220" stroke="#5B9BD5" strokeWidth="3" fill="none" />
              
              {/* Additional connection lines */}
              <path d="M180 80 L220 40" stroke="#5B9BD5" strokeWidth="3" fill="none" />
              <path d="M260 110 L290 80" stroke="#5B9BD5" strokeWidth="3" fill="none" />
              <path d="M260 150 L290 180" stroke="#5B9BD5" strokeWidth="3" fill="none" />
              
              {/* Circuit nodes - main */}
              <circle cx="60" cy="150" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="120" cy="150" r="12" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="120" cy="80" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="180" cy="80" r="12" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="180" cy="130" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="240" cy="130" r="12" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="120" cy="220" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="180" cy="220" r="12" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="240" cy="200" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="240" cy="220" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="300" cy="130" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="340" cy="180" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="220" cy="40" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="290" cy="80" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              <circle cx="290" cy="180" r="10" fill="#5B9BD5" stroke="#fff" strokeWidth="3" />
              
              {/* Decorative small dots */}
              <circle cx="150" cy="105" r="4" fill="#A5C8E5" />
              <circle cx="210" cy="160" r="4" fill="#A5C8E5" />
              <circle cx="270" cy="150" r="4" fill="#A5C8E5" />
              <circle cx="150" cy="185" r="4" fill="#A5C8E5" />
              <circle cx="220" cy="90" r="4" fill="#A5C8E5" />
              <circle cx="260" cy="220" r="4" fill="#A5C8E5" />
            </svg>
          </div>

          {/* Title at bottom */}
          <div className="text-center mt-8">
            <h1 className="text-gray-800 mb-2">
              EMPLOYEE 🌿
            </h1>
            <h1 className="text-gray-800 mb-2">TRANSPORT</h1>
            <h1 className="text-gray-800 mb-2">MANAGEMENT</h1>
            <h2 className="text-gray-400">SYSTEM</h2>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          {/* Role Selection */}
          <div className="flex justify-center gap-8 mb-10">
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                selectedRole === 'admin'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <Shield className="w-8 h-8" />
              </div>
              <span className={`text-sm ${selectedRole === 'admin' ? 'text-gray-800' : 'text-gray-500'}`}>
                ADMIN
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('user')}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                selectedRole === 'user'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className={`text-sm ${selectedRole === 'user' ? 'text-gray-800' : 'text-gray-500'}`}>
                USER
              </span>
            </button>
          </div>

          {/* Form Title */}
          <h2 className="text-center text-gray-700 mb-8">LOGIN TO YOUR ACCOUNT</h2>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50 placeholder:text-gray-400"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50 placeholder:text-gray-400"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-gray-500 cursor-pointer">
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="text-gray-400 hover:text-gray-600">
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full h-12 shadow-md mt-6"
            >
              LOGIN
            </Button>
          </form>

          <p className="text-center text-gray-400 mt-8 text-sm">
            Don't have to account?{' '}
            <a href="#" className="text-gray-600 hover:text-gray-800">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}