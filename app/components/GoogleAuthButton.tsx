'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { auth, setAuthToken } from '@/lib/api';
import { saveToken } from '@/lib/auth';
import { useState } from 'react';

function MockGoogleButton({ onLogin }: { onLogin: () => Promise<void> }) {
  return (
    <div className="w-full">
      <div className="flex justify-center">
        <button
          onClick={onLogin}
          className="w-full max-w-[350px] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-3 font-medium transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google Sign-In (Demo Mode)
        </button>
      </div>
      <p className="mt-2 text-sm text-blue-400 text-center">
        Demo mode: Click to test Google Sign-In flow
      </p>
    </div>
  );
}

export default function GoogleAuthButton() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleMockGoogleLogin = async () => {
    try {
      setError('');

      // Mock Google login flow
      const response = await auth.googleLogin('mock-google-token');

      if (response.token) {
        saveToken(response.token);
        setAuthToken(response.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign in with Google');
    }
  };

  const isClientIdConfigured =
    clientId &&
    clientId !== 'your_google_client_id_here' &&
    clientId !== 'your-google-client-id.apps.googleusercontent.com';

  if (!isClientIdConfigured) {
    return <MockGoogleButton onLogin={handleMockGoogleLogin} />;
  }

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError('');

      if (!credentialResponse.credential) {
        setError('No credential received from Google');
        return;
      }

      const response = await auth.googleLogin(credentialResponse.credential);

      if (response.token) {
        saveToken(response.token);
        setAuthToken(response.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign in with Google');
    }
  };

  const handleError = () => {
    setError(
      'Google Sign-In failed. Please try again or use email/password login.'
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          theme="filled_black"
          size="large"
          width="350"
          text="signin_with"
          shape="rectangular"
          logo_alignment="left"
          auto_select={false}
          cancel_on_tap_outside={true}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
