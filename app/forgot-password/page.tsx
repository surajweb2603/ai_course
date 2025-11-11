'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { auth } from '@/lib/api';

/**
 * Error alert component
 */
function ErrorAlert({ error }: { error: string }) {
  if (!error) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg bg-red-500/10 border border-red-500/20 p-4"
    >
      <p className="text-sm text-red-400">{error}</p>
    </motion.div>
  );
}

/**
 * Success alert component
 */
function SuccessAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg bg-green-500/10 border border-green-500/20 p-4"
    >
      <p className="text-sm text-green-400">{message}</p>
    </motion.div>
  );
}

/**
 * Forgot password form component
 */
function ForgotPasswordForm({
  email,
  setEmail,
  error,
  success,
  loading,
  onSubmit,
}: {
  email: string;
  setEmail: (email: string) => void;
  error: string;
  success: string;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mt-8 space-y-6"
      onSubmit={onSubmit}
    >
      <ErrorAlert error={error} />
      <SuccessAlert message={success} />

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium mb-2 text-gray-700"
        >
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="appearance-none relative block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="you@example.com"
        />
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div>
        <motion.button
          type="submit"
          disabled={loading || !!success}
          whileHover={{ scale: loading || success ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : success ? (
            'Email Sent!'
          ) : (
            'Send Reset Link'
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await auth.forgotPassword({ email });
      setSuccess('If an account with that email exists, a password reset link has been sent. Please check your email.');
      setEmail(''); // Clear email for security
    } catch (err: any) {
      console.error('Forgot password error:', err);
      if (err.response) {
        setError(err.response.data?.error || 'Failed to send reset email. Please try again.');
      } else if (err.request) {
        setError('Unable to connect to server. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#F8F8FC] pt-16 sm:pt-20 lg:pt-24"
    >
      {/* Background decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-30"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-xs tracking-widest text-purple-600 font-medium uppercase mb-4">
              RESET PASSWORD
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-3">
              Forgot <span className="italic font-light text-purple-600">Password?</span>
            </h2>
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>

        <ForgotPasswordForm
          email={email}
          setEmail={setEmail}
          error={error}
          success={success}
          loading={loading}
          onSubmit={handleSubmit}
        />

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

