'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startCheckout } from '@/lib/payments';
import { getToken, getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { Sparkles, CheckCircle2 } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free Student',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out a new subject or skill.',
    features: [
      '1 course to explore',
      '2 modules per course',
      'AI-powered lessons',
      'Basic study materials',
      'Course sharing',
      'Community support'
    ],
    cta: 'Start Learning Free',
    highlighted: false
  },
  {
    id: 'monthly',
    name: 'Pro Learner',
    price: '$9',
    period: 'per month',
    description: 'Unlimited learning with all premium study features.',
    features: [
      'Everything in Free',
      'Unlimited courses',
      'Unlimited modules per course',
      '24/7 AI Study Tutor',
      'Visual learning aids',
      'Video lessons included',
      'PDF certificates with QR codes',
      'Detailed progress tracking',
      'Priority support'
    ],
    cta: 'Upgrade to Pro',
    highlighted: true
  },
  {
    id: 'yearly',
    name: 'Yearly Pro',
    price: '$99',
    period: 'per year',
    description: 'Best value for serious learners—save $18 per year.',
    features: [
      'Everything in Monthly Pro',
      'Unlimited courses',
      'Unlimited modules per course',
      '2 months free (save $18)',
      'Early access to new features',
      'Premium course templates',
      'Advanced learning analytics'
    ],
    cta: 'Go Yearly',
    highlighted: false
  }
];

/**
 * Plan header component
 */
function PlanHeader({ plan }: { plan: typeof plans[0] }) {
  return (
    <div className="relative z-10 text-center mb-4 sm:mb-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-300">
        {plan.name}
      </h3>
      <div className="mb-2 sm:mb-3">
        <span className="text-3xl sm:text-4xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
          {plan.price}
        </span>
        <span className="text-gray-600 text-xs sm:text-sm ml-1">
          {plan.period}
        </span>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
        {plan.description}
      </p>
    </div>
  );
}

/**
 * Plan features list component
 */
function PlanFeatures({ features }: { features: string[] }) {
  return (
    <ul className="relative z-10 space-y-2 mb-6 sm:mb-8">
      {features.map((feature, featureIndex) => (
        <motion.li 
          key={featureIndex} 
          className="flex items-start gap-2 text-gray-700 group-hover:text-gray-900 transition-colors duration-300"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: featureIndex * 0.05 }}
          whileHover={{ x: 4 }}
        >
          <motion.svg 
            className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0 mt-0.5"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            whileHover={{ scale: 1.3, rotate: 360 }}
            transition={{ duration: 0.4 }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </motion.svg>
          <span className="text-sm sm:text-base">{feature}</span>
        </motion.li>
      ))}
    </ul>
  );
}

/**
 * Plan card component
 */
function PlanCard({ 
  plan, 
  checkoutLoading, 
  onSelect,
  currentPlan
}: { 
  plan: typeof plans[0]; 
  checkoutLoading: string | null;
  onSelect: (planId: string) => void;
  currentPlan?: string | null;
}) {
  const isCurrentPlan = currentPlan === plan.id;
  const isDisabled = isCurrentPlan || checkoutLoading === plan.id;

  return (
    <motion.div
      key={plan.id}
      variants={fadeUp}
      animate={{
        y: [0, -6, 0],
        transition: {
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: plans.indexOf(plan) * 0.3,
        }
      }}
      whileHover={!isCurrentPlan ? { 
        y: -16,
        scale: plan.highlighted ? 1.08 : 1.05,
        transition: { duration: 0.3, ease: "easeOut" }
      } : {}}
      className={`relative border rounded-xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 group cursor-pointer shadow-md ${
        plan.highlighted 
          ? 'bg-white border-gray-200 lg:scale-105 shadow-xl' 
          : 'bg-white border-gray-200 hover:border-purple-300'
      } ${isCurrentPlan ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-purple-50/0 to-purple-50/0 hover:from-purple-50/40 hover:via-purple-50/30 hover:to-purple-50/40 transition-all duration-500 rounded-xl overflow-hidden" />
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl blur-xl opacity-0 hover:opacity-25 transition-opacity duration-500 -z-10 pointer-events-none" />
      
      {isCurrentPlan && (
        <motion.div 
          className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 bg-gradient-to-r from-green-600 to-green-700 border border-green-800 text-white text-xs font-semibold rounded-full shadow-lg z-20 flex items-center gap-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span className="relative z-10">Current Plan</span>
        </motion.div>
      )}
      
      {plan.highlighted && !isCurrentPlan && (
        <motion.div 
          className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 bg-gradient-to-r from-purple-600 to-purple-700 border border-purple-800 text-white text-xs font-semibold rounded-full shadow-lg z-20"
          animate={{ 
            scale: [1, 1.05, 1],
            y: [0, -2, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span className="relative z-10">Most Popular</span>
          <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-50 animate-pulse" />
        </motion.div>
      )}
      
      <PlanHeader plan={plan} />
      <PlanFeatures features={plan.features} />

      <motion.button
        onClick={() => !isCurrentPlan && onSelect(plan.id)}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.05 } : {}}
        whileTap={!isDisabled ? { scale: 0.95 } : {}}
        className={`relative block w-full py-2.5 sm:py-3 px-4 text-center text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 overflow-hidden ${
          isCurrentPlan
            ? 'bg-gray-100 border border-gray-300 text-gray-500 cursor-not-allowed'
            : plan.highlighted
            ? 'bg-gradient-to-r from-purple-600 to-purple-700 border border-purple-800 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-lg hover:shadow-purple-500/30'
            : 'border border-gray-300 text-gray-700 hover:border-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <span className="relative z-10">
          {checkoutLoading === plan.id ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Processing...
            </div>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            plan.cta
          )}
        </span>
      </motion.button>
      
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-gray-300 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-gray-300 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

/**
 * Hero section component
 */
function PricingHero() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-[#F8F8FC]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-4 sm:mb-6"
          >
            <div className="inline-flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
              <span className="text-xs tracking-widest text-purple-600 font-medium uppercase">
                PRICING
              </span>
            </div>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Choose Your{' '}
            <span className="italic font-light text-purple-600">Plan</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto px-4">
            Select the perfect plan for your AI course generation needs
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Payment canceled alert component
 */
function PaymentCanceledAlert() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 max-w-md mx-auto"
    >
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Payment Canceled
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Your payment was canceled. You can try again anytime.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PricingContent() {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentCanceled = searchParams.get('payment') === 'cancel';

  // Fetch current user plan
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      const token = getToken();
      if (token) {
        try {
          const user = await getMe();
          if (user?.plan) {
            setCurrentPlan(user.plan);
          }
        } catch (error) {
          // User not authenticated or error fetching plan
          console.error('Error fetching current plan:', error);
        }
      }
      setLoadingPlan(false);
    };

    fetchCurrentPlan();
  }, []);

  const handlePlanSelect = async (planId: string) => {
    // Prevent selecting the same plan
    if (planId === currentPlan) {
      return;
    }

    if (planId === 'free') {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      router.push('/dashboard');
      return;
    }

    if (planId !== 'monthly' && planId !== 'yearly') {
      return;
    }

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setCheckoutLoading(planId);
    try {
      await startCheckout(planId);
    } catch (error: any) {
      if (error.message === 'Not authenticated') {
        router.push('/login');
      } else if (error.response?.status === 400) {
        // Handle case where backend prevents same plan upgrade or other validation errors
        const errorMessage = error.response?.data?.error || 'Unable to process upgrade. Please try again.';
        alert(errorMessage);
        setCheckoutLoading(null);
      } else {
        // Handle other errors
        alert('An error occurred. Please try again.');
        setCheckoutLoading(null);
      }
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-white pt-24">
      <PricingHero />

      {/* Pricing Cards */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
              <span className="text-xs tracking-widest text-purple-600 font-medium uppercase">
                CHOOSE PLAN
              </span>
            </div>
          </motion.div>
          {paymentCanceled && <PaymentCanceledAlert />}

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto"
          >
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                checkoutLoading={checkoutLoading}
                onSelect={handlePlanSelect}
                currentPlan={currentPlan}
              />
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white flex items-center justify-center">
          <span className="text-gray-500 text-sm">Loading pricing...</span>
        </main>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
