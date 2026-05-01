const normalizeApiUrl = (url?: string) => url?.replace(/\/$/, '');
const isLocalApiUrl = (url?: string) => /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url || '');
const PRODUCTION_API_FALLBACK = 'https://etms-backend-il55.onrender.com/api';

export const getApiBaseUrl = () => {
  const env = (import.meta as any)?.env || {};
  const configuredUrl = normalizeApiUrl(env.VITE_API_URL as string | undefined);

  if (configuredUrl) {
    if (!env.DEV && isLocalApiUrl(configuredUrl)) {
      console.warn(
        `Ignoring local API URL "${configuredUrl}" in production. Falling back to ${PRODUCTION_API_FALLBACK}.`
      );
      return PRODUCTION_API_FALLBACK;
    }

    return configuredUrl;
  }

  if (env.DEV) return 'http://localhost:5000/api';

  console.warn(
    `Missing VITE_API_URL in production. Falling back to ${PRODUCTION_API_FALLBACK}. Set VITE_API_URL in Vercel to remove this fallback.`
  );
  return PRODUCTION_API_FALLBACK;
};

// API base URL. In production this must come from Vercel's VITE_API_URL env var.
export const API_BASE_URL = getApiBaseUrl();

// Helper function to get JWT token from localStorage or sessionStorage
function getToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Helper function to set headers with auth token
const getHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// ==================== AUTH API ====================
export const authAPI = {
  // Google OAuth
  googleLogin: (role?: string, intent?: 'signup' | 'login') => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (intent) params.append('intent', intent);
    const query = params.toString() ? `?${params.toString()}` : '';
    window.location.href = `${API_BASE_URL}/auth/google${query}`;
  },

  // Email Signup
  signup: async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'admin' | 'driver' | 'employee';
  }) => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify(data),
      });
    } catch {
      throw new Error(
        `Failed to reach API at ${API_BASE_URL}. Is your backend running and the URL/port correct?`
      );
    }

    if (!response.ok) {
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch {
        // ignore parse errors
      }
      const baseMsg =
        errorBody?.error || errorBody?.message || `Signup failed (HTTP ${response.status})`;
      const detail = errorBody?.detail ? `: ${errorBody.detail}` : '';
      const code = errorBody?.code ? ` [${errorBody.code}]` : '';
      throw new Error(`${baseMsg}${detail}${code}`);
    }

    const result = await response.json();
    return result;
  },

  // Email Login
  login: async (email: string, password: string) => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error(
        `Failed to reach API at ${API_BASE_URL}. Is your backend running and the URL/port correct?`
      );
    }

    if (!response.ok) {
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch {
        // ignore parse errors
      }
      const baseMsg =
        errorBody?.error || errorBody?.message || `Login failed (HTTP ${response.status})`;
      const detail = errorBody?.detail ? `: ${errorBody.detail}` : '';
      const code = errorBody?.code ? ` [${errorBody.code}]` : '';
      throw new Error(`${baseMsg}${detail}${code}`);
    }

    const result = await response.json();
    return result;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
  },

  // Verify OTP
  verifyOTP: async (email: string, otp: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || errorBody.message || 'OTP Verification failed');
    }
    return response.json();
  },

  // Forgot Password
  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || errorBody.message || 'Failed to send reset email');
    }
    return response.json();
  },

  // Reset Password
  resetPassword: async (token: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ token, newPassword }),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || errorBody.message || 'Failed to reset password');
    }
    return response.json();
  },

  // Check if email exists
  checkEmail: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email }),
    });
    if (!response.ok) return { exists: false };
    return response.json();
  },
};

// ==================== EMPLOYEE API ====================
type EmployeeAPI = {
  getAll: () => Promise<any>;
  getById: (id: number) => Promise<any>;
  create: (data: any) => Promise<any>;
  update: (id: number, data: any) => Promise<any>;
  delete: (id: number) => Promise<any>;
  completeOnboarding: (data: {
    employeeId: string;
    employeeName: string;
    phone: string;
    department?: string;
    projectCode?: string;
    address?: string;
    pickupPoint?: string;
  }) => Promise<any>;
};

export const employeeAPI: EmployeeAPI = {
  // Get all employees
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  },

  // Get employee by ID
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch employee');
    return response.json();
  },

  // Create employee
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to create employee');
    return response.json();
  },

  // Update employee
  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update employee');
    return response.json();
  },

  // Delete employee
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to delete employee');
    return response.json();
  },

  completeOnboarding: async (data: {
    employeeId: string;
    employeeName: string;
    phone: string;
    department?: string;
    projectCode?: string;
    address?: string;
    pickupPoint?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/onboarding/employee`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || `Failed to save employee onboarding (HTTP ${response.status})`);
    }
    return response.json();
  },
};

// ==================== USER API ====================
type UserAPI = {
  getAll: () => Promise<any>;
  getById: (id: number) => Promise<any>;
  create: (data: any) => Promise<any>;
  update: (id: number, data: any) => Promise<any>;
  delete: (id: number) => Promise<any>;
};

export const userAPI: UserAPI = {
  // Get all users (employees)
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  // Get user by ID
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  // Create user
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  // Update user
  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  // Delete user
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },
};

// ==================== DRIVER API ====================
type DriverAPI = {
  getMyProfile: () => Promise<any>;
  getAll: () => Promise<any>;
  getById: (id: number) => Promise<any>;
  create: (data: any) => Promise<any>;
  updateStatus: (id: number, status: 'active' | 'inactive' | 'on_leave') => Promise<any>;
  getEarnings: (id: number) => Promise<any>;
  completeOnboarding: (data: {
    driverName: string;
    phone: string;
    licenseNumber: string;
    vehicleName?: string;
    vehicleNumber: string;
    carModel?: string;
    capacity?: number;
    vehicleImage?: string;
  }) => Promise<any>;
  delete: (id: number) => Promise<any>;
  update: (id: number, data: any) => Promise<any>;
};

export const driverAPI: DriverAPI = {
  // Get logged-in driver's own profile, trips and stats
  getMyProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/me`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch driver profile');
      return response.json();
    } catch (error) {
      console.warn('Driver profile API failed, using mock data');
      // Mock data for demonstration
      return {
        id: 1,
        name: 'John Driver',
        email: 'john.driver@company.com',
        phone: '+91-9876543210',
        license_no: 'DL123456',
        vehicle_assigned: 'MH01AB1234',
        status: 'active',
        total_trips: 45,
        rating: 4.8
      };
    }
  },

  // Get all drivers
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/drivers`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch drivers');

    return response.json();
  },

  // Get driver by ID
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch driver');
    return response.json();
  },

  // Create driver
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/drivers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to create driver');
    return response.json();
  },

  // Update driver status
  updateStatus: async (id: number, status: 'active' | 'inactive' | 'on_leave') => {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) throw new Error('Failed to update driver status');
    return response.json();
  },

  // Update driver
  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update driver');
    return response.json();
  },

  // Get driver earnings
  getEarnings: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}/earnings`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch driver earnings');
    return response.json();
  },

  completeOnboarding: async (data: {
    driverName: string;
    phone: string;
    licenseNumber: string;
    vehicleName?: string;
    vehicleNumber: string;
    carModel?: string;
    capacity?: number;
    vehicleImage?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/onboarding/driver`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to save driver onboarding');
    return response.json();
  },

  // Delete driver
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to delete driver');
    return response.json();
  },
};

// ==================== VEHICLE API ====================
export const vehicleAPI = {
  // Get all vehicles
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch vehicles');
    return response.json();
  },

  // Get vehicle by ID
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch vehicle');
    return response.json();
  },

  // Create vehicle
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to create vehicle');
    return response.json();
  },

  // Update vehicle
  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update vehicle');
    return response.json();
  },

  // Delete vehicle
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to delete vehicle');
    return response.json();
  },
};

// ==================== PROFILE API ====================
export const profileAPI = {
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },
};

// ==================== TRIP API ====================
export const tripAPI = {
  // Request a trip
  requestTrip: async (data: {
    start_location: string;
    end_location: string;
    scheduled_time: string;
    employee_id?: number;
    driver_id?: number;
    vehicle_id?: number;
    status?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Failed to request trip (HTTP ${response.status})`);
    }
    return response.json();
  },

  // Create admin route
  createAdminRoute: async (data: {
    vehicle_number: string;
    driver_id: number;
    start_location: string;
    end_location: string;
    scheduled_time: string;
    employee_ids: number[];
  }) => {
    const response = await fetch(`${API_BASE_URL}/admin/routes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create admin route');
    }
    return response.json();
  },

  // Get user trips
  getUserTrips: async () => {
    const response = await fetch(`${API_BASE_URL}/trips/my-trips`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch trips');
    return response.json();
  },

  // Get all trips (admin)
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch trips');
    return response.json();
  },

  // Get trip details
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch trip');
    return response.json();
  },

  // Verify User Trip OTP (Driver)
  verifyTripOTP: async (tripId: number, otp: string) => {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ otp }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid OTP');
    }
    return response.json();
  },

  // Update trip status
  updateStatus: async (id: number, status: string) => {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) throw new Error('Failed to update trip');
    return response.json();
  },

  // Delete trip
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to delete trip');
    return response.json();
  },

  // Get current user's active (in_progress) trip
  getActiveTrip: async (): Promise<any | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trips/my-trips`, {
        headers: getHeaders(),
      });
      if (!response.ok) return null;
      const trips: any[] = await response.json();
      return trips.find((t: any) => t.status === 'in_progress') ?? null;
    } catch {
      return null;
    }
  },

  // Verify OTP to start trip
  verifyOtp: async (id: number, otp: string) => {
    const response = await fetch(`${API_BASE_URL}/trips/${id}/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ otp }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to verify OTP');
    }
    return response.json();
  },

  // Complete trip (Geofencing / Manual)
  completeTrip: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/trips/${id}/complete`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to complete trip');
    }
    return response.json();
  },
};

// ==================== PAYMENT API ====================
export const paymentAPI = {
  // Get all payments
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  },

  // Create payment
  create: async (data: {
    trip_id?: number;
    user_id: number;
    amount: number;
    payment_method: string;
    transaction_id?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create payment');
    return response.json();
  },

  // Initiate a payout (Generic)
  initiatePayout: async (payoutData: {
    recipient_id: string | number;
    recipient_type: 'driver' | 'employee';
    amount: number;
    currency?: string;
    description?: string;
    transaction_id?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/payments/payout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payoutData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create payout');
    }
    return response.json();
  },

  // Get payout history (admin)
  getHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/payments/history`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payout history');
    return response.json();
  },

  // Get payment stats (admin)
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/payments/stats`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payment stats');
    return response.json();
  },

  // Get driver's own payouts
  getMyDriverPayouts: async () => {
    const response = await fetch(`${API_BASE_URL}/payments/driver/my-payouts`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch driver payouts');
    return response.json();
  },

  // Update payout status
  updatePayoutStatus: async (payoutId: string, status: 'pending' | 'success' | 'failed', transactionId?: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/payout/${payoutId}/update`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, transaction_id: transactionId }),
    });
    if (!response.ok) throw new Error('Failed to update payout status');
    return response.json();
  },
};


// ==================== FEEDBACK API ====================
export const feedbackAPI = {
  submit: async (data: {
    trip_id: number;
    feedback_type: 'complaint' | 'appreciation' | 'suggestion';
    message: string;
    rating: number;
  }) => {
    const token = getToken();
    if (!token) throw new Error('No auth token');
    const res = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return res.json();
  },

  getAll: async () => {
    const token = getToken();
    if (!token) throw new Error('No auth token');
    const res = await fetch(`${API_BASE_URL}/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch feedback');
    return res.json();
  },

  getMyFeedback: async () => {
    const token = getToken();
    if (!token) throw new Error('No auth token');
    const res = await fetch(`${API_BASE_URL}/feedback/my-feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch user feedback');
    return res.json();
  },
};

// ==================== LOCATION TRACKING API ====================
export const locationAPI = {
  // Track driver location
  track: async (data: {
    driver_id: number;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    trip_id?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/location/track`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to track location');
    }
    return response.json();
  },

  // Get current driver location
  getDriverLocation: async (driver_id: number) => {
    const response = await fetch(`${API_BASE_URL}/location/driver/${driver_id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch driver location');
    }
    return response.json();
  },

  // Get all active driver locations (admin)
  getActiveLocations: async () => {
    const response = await fetch(`${API_BASE_URL}/location/active`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch active locations');
    return response.json();
  },

  // Get location history for a trip
  getTripLocationHistory: async (trip_id: number) => {
    const response = await fetch(`${API_BASE_URL}/location/trip/${trip_id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch trip location history');
    return response.json();
  },
};

// ==================== EMERGENCY API ====================
export const emergencyAPI = {
  trigger: async (data: {
    userId?: string;
    userRole?: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    location: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    timestamp: string;
    deviceInfo?: {
      userAgent: string;
      platform: string;
      language: string;
    };
    emergencyLevel?: string;
    status?: string;
    description?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/emergency/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emergency-Priority': 'CRITICAL',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to trigger emergency alert');
    return response.json();
  },

  // Backup email notification
  emailBackup: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/emergency/email-backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emergency-Backup': 'EMAIL',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to send email backup');
    return response.json();
  },

  // Backup SMS notification
  smsBackup: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/emergency/sms-backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emergency-Backup': 'SMS',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to send SMS backup');
    return response.json();
  },

  // Get emergency logs for admin
  getEmergencyLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/emergency/logs`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch emergency logs');
    return response.json();
  },

  // Update emergency status
  updateEmergencyStatus: async (emergencyId: string, status: string) => {
    const response = await fetch(`${API_BASE_URL}/emergency/${emergencyId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) throw new Error('Failed to update emergency status');
    return response.json();
  },
};

// ==================== ATTENDANCE API ====================
export const attendanceAPI = {
  updateEmployeeAttendance: async (tripId: string, employeeId: string, data: {
    status: 'picked' | 'absent';
    timestamp: string;
    location: {
      latitude: number;
      longitude: number;
    };
  }) => {
    const response = await fetch(`${API_BASE_URL}/trip/${tripId}/employee/${employeeId}/attendance`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update attendance');
    return response.json();
  },

  getTripEmployees: async (tripId: string) => {
    const response = await fetch(`${API_BASE_URL}/trip/${tripId}/employees`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch trip employees');
    return response.json();
  },
};

// ==================== DRIVER FEEDBACK API ====================
export const driverFeedbackAPI = {
  // Get feedback for currently logged-in driver
  getMyFeedback: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/driver/feedback`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch driver feedback');
      return response.json();
    } catch (error) {
      console.warn('Driver feedback API failed, using mock data');
      // Mock data for demonstration
      return [
        {
          id: 1,
          trip_id: 1,
          passenger_name: 'Alice Employee',
          rating: 5,
          comment: 'Excellent driving, very smooth and safe!',
          date: '2026-02-20',
          trip_route: 'Andheri to BKC'
        },
        {
          id: 2,
          trip_id: 2,
          passenger_name: 'Bob Employee',
          rating: 4,
          comment: 'Good service, arrived on time',
          date: '2026-02-19',
          trip_route: 'Bandra to Andheri'
        }
      ];
    }
  },

  // Legacy alias
  getDriverFeedback: async (_driverId: string) => {
    const response = await fetch(`${API_BASE_URL}/driver/feedback`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch driver feedback');
    return response.json();
  },
};

// ==================== DRIVER ROUTES API ====================
export const driverRoutesAPI = {
  getDriverRoutes: async (driverId: string) => {
    const response = await fetch(`${API_BASE_URL}/driver/${driverId}/routes`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch driver routes');
    return response.json();
  },

  getRouteDetails: async (routeId: string) => {
    const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch route details');
    return response.json();
  },

  startRoute: async (routeId: string) => {
    const response = await fetch(`${API_BASE_URL}/routes/${routeId}/start`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to start route');
    return response.json();
  },
};

export const routesAPI = {
  // Get all routes
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/routes`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch routes');
    return response.json();
  },

  // Get route by ID
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/routes/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch route');
    return response.json();
  },

  // Create route
  create: async (data: {
    route_name: string;
    start_location: string;
    end_location: string;
    scheduled_time?: string;       // ISO datetime string
    distance?: number;
    estimated_duration?: number;
    assigned_driver_id?: number;
    vehicle_id?: number;
    max_passengers?: number;
    waypoints?: string[];          // intermediate stops
    employee_ids?: number[];       // employees to pre-assign
  }) => {
    const response = await fetch(`${API_BASE_URL}/routes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create route');
    }
    return response.json();
  },

  // Update route
  update: async (
    id: number,
    data: {
      route_name?: string;
      start_location?: string;
      end_location?: string;
      scheduled_time?: string;
      distance?: number;
      estimated_duration?: number;
      assigned_driver_id?: number;
      vehicle_id?: number;
      max_passengers?: number;
      waypoints?: string[];
      status?: string;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/routes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update route');
    return response.json();
  },

  // Delete route
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/routes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete route');
    return response.json();
  },

  // Get route details including all trips (stops)
  getFullDetailedRoute: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/routes/${id}/details`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch full route details');
    }
    return response.json();
  },
};

// ==================== RAZORPAY API ====================
export const razorpayAPI = {
  createOrder: async (amount: number, currency = 'INR') => {
    const response = await fetch(`${API_BASE_URL}/razorpay/order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, currency }),
    });
    if (!response.ok) throw new Error('Failed to create Razorpay order');
    return response.json();
  },

  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/razorpay/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to verify Razorpay payment');
    return response.json();
  },
};


