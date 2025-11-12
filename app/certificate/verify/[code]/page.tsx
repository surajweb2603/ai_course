'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Award,
  User,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';

interface CertificateData {
  name: string;
  courseTitle: string;
  issuedAt: string;
  code: string;
}

interface UserData {
  name: string;
  email: string;
}

interface CourseData {
  title: string;
  description?: string;
}

interface VerificationResponse {
  valid: boolean;
  certificate: CertificateData;
  user: UserData;
  course: CourseData;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function useCertificateVerification(code: string | undefined) {
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const verifyCertificate = useCallback(async () => {
    if (!code) {
      setError('Invalid certificate code');
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const API_BASE_URL = process.env.APP_BASE_URL || '/api';
      const response = await fetch(
        `${API_BASE_URL}/certificates/verify/${code}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        let errorMessage = 'Certificate not found';
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = (await response.text()) || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Unexpected response format from verification service');
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err: any) {
      setError(err.message || 'Failed to verify certificate');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void verifyCertificate();
  }, [verifyCertificate]);

  return { data, loading, error };
}

function useCopyStatus() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (value?: string) => {
    if (!value) {
      return;
    }
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return { copied, copy };
}

function VerificationLoading(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-700 text-lg font-medium">
          Verifying certificate...
        </p>
      </div>
    </div>
  );
}

function VerificationError({
  code,
  message,
}: {
  code: string;
  message: string;
}): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Certificate Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          {message ||
            'The certificate code you entered is invalid or does not exist.'}
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Certificate Code</p>
          <p className="text-lg font-mono font-semibold text-gray-900">
            {code}
          </p>
        </div>
        <button
          onClick={() => (window.location.href = '/')}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
        >
          Go to Homepage
        </button>
      </motion.div>
    </div>
  );
}

function CertificateHeader(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-full mb-4">
        <CheckCircle2 className="w-4 h-4" />
        Verified Certificate
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
        Certificate Verification
      </h1>
      <p className="text-gray-600 text-lg">
        This certificate has been verified and is authentic
      </p>
    </motion.div>
  );
}

function CertificateCardHeader(): JSX.Element {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-3">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Certificate of Completion</h2>
            <p className="text-purple-100 text-sm">
              Verified by AiCourse Generator
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="bg-white/20 rounded-full p-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificateStatement({
  certificate,
}: {
  certificate: CertificateData;
}): JSX.Element {
  return (
    <div className="text-center mb-8 pb-8 border-b border-gray-200">
      <p className="text-gray-600 mb-4">This is to certify that</p>
      <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
        {certificate.name}
      </h3>
      <p className="text-gray-600 mb-4">has successfully completed</p>
      <h4 className="text-2xl md:text-3xl font-bold text-purple-600 mb-4">
        {certificate.courseTitle}
      </h4>
      <p className="text-gray-500 text-sm italic">
        An online non-credit course authorized by AiCourse and offered through
        Artificial Intelligence AI.
      </p>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  helper,
  accent,
}: {
  icon: JSX.Element;
  label: string;
  value: JSX.Element | string;
  helper?: JSX.Element | string;
  accent: string;
}): JSX.Element {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl ${accent}`}>
      {icon}
      <div className="flex-1">
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <div className="text-lg font-semibold text-gray-900">{value}</div>
        {helper && <div className="text-sm text-gray-500 mt-1">{helper}</div>}
      </div>
    </div>
  );
}

function CertificateInfoGrid({
  certificate,
  user,
  course,
  onCopy,
  copied,
}: {
  certificate: CertificateData;
  user: UserData;
  course: CourseData;
  onCopy: () => void;
  copied: boolean;
}): JSX.Element {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      <InfoTile
        icon={
          <div className="bg-purple-100 rounded-lg p-3">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
        }
        label="Issued On"
        value={formatDate(certificate.issuedAt)}
        accent="bg-purple-50"
      />
      <InfoTile
        icon={
          <div className="bg-gray-200 rounded-lg p-3">
            <Award className="w-6 h-6 text-gray-700" />
          </div>
        }
        label="Certificate Code"
        value={
          <div className="flex items-center gap-2">
            <span className="font-mono">{certificate.code}</span>
            <button
              onClick={onCopy}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        }
        accent="bg-gray-50"
      />
      <InfoTile
        icon={
          <div className="bg-blue-100 rounded-lg p-3">
            <User className="w-6 h-6 text-blue-600" />
          </div>
        }
        label="Certificate Holder"
        value={user.name}
        helper={user.email}
        accent="bg-blue-50"
      />
      <InfoTile
        icon={
          <div className="bg-green-100 rounded-lg p-3">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
        }
        label="Course"
        value={course.title}
        helper={
          course.description ? (
            <span className="line-clamp-2">{course.description}</span>
          ) : undefined
        }
        accent="bg-green-50"
      />
    </div>
  );
}

function VerificationNote(): JSX.Element {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-gray-900 mb-1">
            Verification Status
          </p>
          <p className="text-sm text-gray-700">
            This certificate has been verified and is authentic. The certificate
            code is unique and can be used to verify the certificate at any
            time.
          </p>
        </div>
      </div>
    </div>
  );
}

function CertificateDetailsCard({
  certificate,
  user,
  course,
  onCopy,
  copied,
}: {
  certificate: CertificateData;
  user: UserData;
  course: CourseData;
  onCopy: () => void;
  copied: boolean;
}): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6"
    >
      <CertificateCardHeader />
      <div className="p-8 md:p-12">
        <CertificateStatement certificate={certificate} />
        <CertificateInfoGrid
          certificate={certificate}
          user={user}
          course={course}
          onCopy={onCopy}
          copied={copied}
        />
        <VerificationNote />
      </div>
    </motion.div>
  );
}

function CertificateActions(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col sm:flex-row gap-4 justify-center print:hidden"
    >
      <button
        type="button"
        onClick={() => (window.location.href = '/')}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
      >
        Go to Homepage
      </button>
    </motion.div>
  );
}

function CertificateFooterNote(): JSX.Element {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-center text-sm text-gray-500 mt-8 print:hidden"
    >
      For any questions about this certificate, please contact support.
    </motion.p>
  );
}

function CertificateView({
  data,
  onCopy,
  copied,
}: {
  data: VerificationResponse;
  onCopy: () => void;
  copied: boolean;
}): JSX.Element {
  useEffect(() => {
    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          margin: 0.5in;
          size: A4 landscape;
        }
        body {
          background: white !important;
        }
        .print\\:hidden {
          display: none !important;
        }
        .print\\:block {
          display: block !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-12 px-4 print:bg-white print:py-4">
      <div className="max-w-4xl mx-auto print:max-w-full">
        <CertificateHeader />
        <CertificateDetailsCard
          certificate={data.certificate}
          user={data.user}
          course={data.course}
          onCopy={onCopy}
          copied={copied}
        />
        <CertificateActions />
        <CertificateFooterNote />
      </div>
    </div>
  );
}

export default function CertificateVerifyPage() {
  const params = useParams();
  const code = params.code as string | undefined;
  const { data, loading, error } = useCertificateVerification(code);
  const { copied, copy } = useCopyStatus();

  if (loading) {
    return <VerificationLoading />;
  }

  if (error || !data?.valid || !code) {
    return (
      <VerificationError
        code={code ?? 'Unknown'}
        message={error || 'Certificate not found'}
      />
    );
  }

  return (
    <CertificateView
      data={data}
      copied={copied}
      onCopy={() => copy(data.certificate.code)}
    />
  );
}
