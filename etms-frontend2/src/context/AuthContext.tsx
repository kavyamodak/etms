import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'driver' | 'employee' | 'user';
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<User>;
  signup: (data: any) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeJwtPayload = (token: string) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return JSON.parse(atob(padded));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreAuth = () => {
      try {
        const shouldPersist = localStorage.getItem('persistAuth') === '1';
        if (!shouldPersist) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          localStorage.removeItem('userRole');
        }
        const storage = shouldPersist ? localStorage : sessionStorage;

        // --- NEW: Check URL for Google OAuth Tokens ---
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const urlRole = params.get('role');
        const urlEmail = params.get('email');

        if (urlToken && urlRole && urlEmail) {
          console.log('✅ Found Google OAuth token in URL');
          
          // Check if this is a fresh OAuth callback (not a page refresh)
          const isOAuthCallback = sessionStorage.getItem('oauthInProgress') === '1';
          
          if (isOAuthCallback) {
            // Clear the flag
            sessionStorage.removeItem('oauthInProgress');
            
            // Show confirmation dialog before auto-login
            const confirmLogin = window.confirm(
              `Google OAuth successful!\n\nEmail: ${urlEmail}\nRole: ${urlRole}\n\nDo you want to continue with this account?`
            );
            
            if (!confirmLogin) {
              // User declined, clear URL and stop
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          }
          
          // Decode token to get full profile
          const payload = decodeJwtPayload(urlToken);
          const userData: User = {
            id: payload.id,
            email: urlEmail,
            role: urlRole as any,
            full_name: payload.full_name || urlEmail,
          };

          // Save to storage
          storage.setItem('authToken', urlToken);
          storage.setItem('authUser', JSON.stringify(userData));

          const urlIsNew = params.get('isNew');
          if (urlIsNew === '1') {
            // Simulate new signup onboarding flags since Google skips the signup form
            sessionStorage.setItem('needsOnboarding', '1');
            sessionStorage.setItem('onboardingRole', userData.role);
            sessionStorage.setItem('userEmail', userData.email);
            sessionStorage.setItem('userFullName', userData.full_name);
          } else {
            sessionStorage.removeItem('needsOnboarding');
          }

          setToken(urlToken);
          setUser(userData);

          // Clean up URL without reloading the page
          window.history.replaceState({}, document.title, window.location.pathname);
          return; // Exit early!
        }
        // ----------------------------------------------

        const savedToken = storage.getItem('authToken');
        const savedUser = storage.getItem('authUser');

        if (savedToken && savedUser) {
          const parsedUser: User = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser);
          console.log('✅ Auth restored for user:', parsedUser.email);
        } else {
          console.log('ℹ️ No saved auth session found');
        }
      } catch (error) {
        console.error('❌ Failed to restore auth:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('persistAuth');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const response = await authAPI.login(email, password);

      const payload = decodeJwtPayload(response.token);
      const userData: User = {
        id: payload.id,
        email,
        role: payload.role || response.role, // fallback if payload missing
        full_name: payload.full_name || email,
      };

      const storage = rememberMe ? localStorage : sessionStorage;

      if (rememberMe) {
        localStorage.setItem('persistAuth', '1');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
      } else {
        localStorage.removeItem('persistAuth');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('userRole');
      }

      storage.setItem('authToken', response.token);
      storage.setItem('authUser', JSON.stringify(userData));
      if (rememberMe) {
        localStorage.setItem('userRole', userData.role);
      }

      setToken(response.token);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const signup = async (data: any) => {
    try {
      const response = await authAPI.signup(data);

      // If the backend returns `requiresOTP: true` (which it now does),
      // we DON'T set the token yet. We return this truthy state so the 
      // UI knows to render the OTP verification screen.
      if (response.requiresOTP) {
        return { requiresOTP: true, email: response.email };
      }

      // Backward compatibility / Fallback
      if (response.token) {
        const userData: User = {
          id: response.id || 0,
          email: data.email,
          role: response.role,
          full_name: data.fullName,
        };

        localStorage.removeItem('persistAuth');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('userRole');
        sessionStorage.setItem('authToken', response.token);
        sessionStorage.setItem('authUser', JSON.stringify(userData));

        setToken(response.token);
        setUser(userData);
      }
      return response;
    } catch (error) {
      console.error('❌ Signup failed:', error);
      throw error;
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await authAPI.verifyOTP(email, otp);

      const payload = decodeJwtPayload(response.token);
      const userData: User = {
        id: payload.id,
        email: response.user?.email || email,
        role: response.user?.role || payload.role,
        full_name: payload.full_name || email,
      };

      // Treat successful OTP verify as a fresh non-persisted login
      localStorage.removeItem('persistAuth');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('userRole');
      sessionStorage.setItem('authToken', response.token);
      sessionStorage.setItem('authUser', JSON.stringify(userData));

      setToken(response.token);
      setUser(userData);
      return response;
    } catch (error) {
      console.error('❌ OTP Verification failed:', error);
      throw error;
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };

      const shouldPersist = localStorage.getItem('persistAuth') === '1';
      const storage = shouldPersist ? localStorage : sessionStorage;
      storage.setItem('authUser', JSON.stringify(next));

      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('persistAuth');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    // Hard redirect so ProtectedRoute re-evaluation is immediate, regardless of React render timing
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        signup,
        verifyOTP,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
