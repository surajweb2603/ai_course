'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { initializeAuth } from '@/lib/auth';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  
  if (!clientId) {
  }

  // Initialize authentication when the app loads
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}

