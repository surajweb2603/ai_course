import { auth, setAuthToken } from './api';

const TOKEN_KEY = 'aicourse_token';
const REMEMBER_ME_KEY = 'aicourse_remember_me';
const EXPIRY_KEY = 'aicourse_token_expiry';

export function saveToken(token: string, rememberMe: boolean = false): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
    
    // Set expiry time: 30 days if rememberMe, 7 days otherwise
    const expiryDays = rememberMe ? 30 : 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    localStorage.setItem(EXPIRY_KEY, expiryDate.toISOString());
    
    setAuthToken(token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiryStr = localStorage.getItem(EXPIRY_KEY);
    
    // Check if token has expired
    if (token && expiryStr) {
      const expiryDate = new Date(expiryStr);
      const now = new Date();
      
      if (now > expiryDate) {
        // Token expired, clear it
        clearToken();
        return null;
      }
    }
    
    return token;
  }
  return null;
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    setAuthToken(null);
  }
}

export async function getMe() {
  const token = getToken();
  if (!token) {
    return null;
  }
  
  setAuthToken(token);
  
  try {
    const response = await auth.me();
    return response.user;
  } catch (error) {
    clearToken();
    return null;
  }
}

export function initializeAuth(): void {
  const token = getToken();
  if (token) {
    setAuthToken(token);
  }
}

