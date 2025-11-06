'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmSession } from '@/lib/payments';

function BillingSuccessContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [plan, setPlan] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const confirmPayment = async () => {
      try {
        const result = await confirmSession(sessionId);
        
        if (result.ok) {
          setStatus('success');
          setPlan(result.plan || '');
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    confirmPayment();
  }, [sessionId]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setStatus('loading');
    
    if (sessionId) {
      const confirmPayment = async () => {
        try {
          const result = await confirmSession(sessionId);
          
          if (result.ok) {
            setStatus('success');
            setPlan(result.plan || '');
          } else {
            setStatus('error');
          }
        } catch (error) {
          setStatus('error');
        }
      };

      confirmPayment();
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Verifying Payment</h1>
          <p className="mt-2 text-gray-600">Please wait while we confirm your subscription...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex justify-center">
              <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-bold text-red-900">Payment Verification Failed</h1>
            <p className="mt-2 text-red-700">
              We couldn't verify your payment. This might be a temporary issue.
            </p>
            <div className="mt-6">
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again {retryCount > 0 && `(${retryCount})`}
              </button>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/pricing')}
                className="text-red-600 hover:text-red-500 underline"
              >
                Back to Pricing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex justify-center">
            <svg className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-green-900">Payment Successful!</h1>
          <p className="mt-2 text-green-700">
            Your subscription has been activated successfully.
          </p>
          {plan && (
            <p className="mt-2 text-green-700 font-medium">
              Your plan: <span className="capitalize">{plan}</span>
            </p>
          )}
          <div className="mt-6">
            <button
              onClick={handleGoToDashboard}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-600">
              You can now access all premium features!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-600 text-sm">Loading billing status...</div>
        </div>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}
