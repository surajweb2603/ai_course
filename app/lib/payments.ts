import axios from 'axios';
import { getToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export interface Plan {
  id: string;
  name: string;
  price: number;
  stripePriceId?: string;
  description: string;
  features: string[];
}

export interface CheckoutResponse {
  url: string;
}

export interface ConfirmResponse {
  ok: boolean;
  plan?: string;
  error?: string;
}

// Fetch available plans
export const fetchPlans = async (): Promise<Plan[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stripe/plans`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch plans');
  }
};

// Start checkout process
export const startCheckout = async (plan: 'monthly' | 'yearly'): Promise<void> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_BASE_URL}/stripe/checkout`,
      { plan },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { url } = response.data as CheckoutResponse;
    window.location.href = url;
  } catch (error: any) {
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      throw new Error('Not authenticated');
    } else if (error.response?.status === 500) {
      const errorMessage = error.response?.data?.error || 'Server error';
      throw new Error(`Server error: ${errorMessage}`);
    } else if (error.message === 'Not authenticated') {
      throw error; // Re-throw authentication errors
    } else {
      throw new Error('Failed to start checkout');
    }
  }
};

// Confirm payment session
export const confirmSession = async (sessionId: string): Promise<ConfirmResponse> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_BASE_URL}/stripe/confirm`,
      { session_id: sessionId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data as ConfirmResponse;
  } catch (error) {
    return { ok: false, error: 'Failed to confirm payment' };
  }
};
