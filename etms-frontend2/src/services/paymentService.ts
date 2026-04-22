// Stripe Payment Service for ETMS
import { STRIPE_CONFIG } from '../config/stripeConfig';
import { getApiBaseUrl } from './api';

// Note: Stripe SDK will be installed via npm
// For now, we'll use the API approach for frontend
// In production, the actual Stripe operations happen on the backend


export interface PayoutRequest {
  recipient_id: string;
  recipient_type: 'driver' | 'employee';
  amount: number;
  currency?: string;
}

export interface Payout {
  id: string;
  recipient_id: string;
  recipient_type: 'driver' | 'employee';
  amount: number;
  currency: string;
  stripe_transfer_id: string | null;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface PayoutResponse {
  success: boolean;
  payout?: Payout;
  error?: string;
  stripeTransferId?: string;
}

export interface PayoutHistoryResponse {
  success: boolean;
  payouts: Payout[];
  error?: string;
}

// Helper function to get JWT token
const getToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Helper function to set headers
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

// Create a payout
export const createPayout = async (payoutData: PayoutRequest): Promise<PayoutResponse> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    
    // Create payout in our database
    const response = await fetch(`${API_BASE_URL}/payments/payout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payoutData),
    });

    const dbPayout = await response.json();

    if (!dbPayout.success) {
      return { success: false, error: dbPayout.error || 'Failed to create payout' };
    }

    return {
      success: true,
      payout: dbPayout.payout,
      stripeTransferId: dbPayout.payout.stripe_transfer_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Get payout history
export const getPayoutHistory = async (): Promise<PayoutHistoryResponse> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    
    const response = await fetch(`${API_BASE_URL}/payments/history`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, payouts: [], error: data.error || 'Failed to fetch payout history' };
    }

    return { success: true, payouts: data.payouts };
  } catch (error) {
    return {
      success: false,
      payouts: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Calculate driver earnings based on completed trips
export const calculateDriverEarnings = async (driverId: string): Promise<number> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/earnings`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    return data.success ? data.earnings : 0;
  } catch (error) {
    console.error('Error calculating driver earnings:', error);
    return 0;
  }
};

// Calculate employee monthly salary
export const calculateEmployeeSalary = async (employeeId: string, projectCode: string): Promise<number> => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/salary`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ project_code: projectCode }),
    });

    const data = await response.json();
    return data.success ? data.salary : 0;
  } catch (error) {
    console.error('Error calculating employee salary:', error);
    return 0;
  }
};

// Get available drivers for payout
export const getAvailableDrivers = async () => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    
    const response = await fetch(`${API_BASE_URL}/drivers/available-for-payout`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    return data.success ? data.drivers : [];
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    return [];
  }
};

// Get available employees for payout
export const getAvailableEmployees = async () => {
  try {
    const API_BASE_URL = getApiBaseUrl();
    
    const response = await fetch(`${API_BASE_URL}/employees/available-for-payout`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    return data.success ? data.employees : [];
  } catch (error) {
    console.error('Error fetching available employees:', error);
    return [];
  }
};
