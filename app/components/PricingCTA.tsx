'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { getToken } from '@/lib/auth';
import { Sparkles } from 'lucide-react';

const plans = [
  {
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

export default function PricingCTA() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 bg-white">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="text-center mb-8 sm:mb-12 lg:mb-16"
      >
        <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          <div className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
            Pricing
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-bold text-gray-900 mb-4 sm:mb-6 px-4">
          Start Your Learning Journey Today
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
          Begin free, unlock unlimited learning when you're ready to master more subjects
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto px-4"
      >
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            variants={fadeUp}
            animate={{
              y: [0, -6, 0],
              transition: {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3,
              }
            }}
            whileHover={{ 
              y: -16,
              scale: plan.highlighted ? 1.08 : 1.05,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            className={`relative bg-white border rounded-xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 group cursor-pointer shadow-md ${
              plan.highlighted 
                ? 'border-gray-200 lg:scale-105 shadow-xl' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-purple-50/0 to-purple-50/0 hover:from-purple-50/40 hover:via-purple-50/30 hover:to-purple-50/40 transition-all duration-500 rounded-xl overflow-hidden" />
            
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl blur-xl opacity-0 hover:opacity-25 transition-opacity duration-500 -z-10 pointer-events-none" />
            {plan.highlighted && (
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
              <p className="text-gray-600 text-base leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                {plan.description}
              </p>
            </div>

            <ul className="relative z-10 space-y-2 mb-6 sm:mb-8">
              {plan.features.map((feature, featureIndex) => (
                <motion.li 
                  key={featureIndex} 
                  className="flex items-start gap-2 text-gray-700 group-hover:text-gray-900 transition-colors duration-300"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
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
                  <span className="text-base">{feature}</span>
                </motion.li>
              ))}
            </ul>

            <motion.a
              href={plan.cta === 'Start Learning Free' && isLoggedIn ? "/dashboard" : plan.cta === 'Start Learning Free' ? "/register" : "#get-started"}
              className={`relative block w-full py-2.5 sm:py-3 text-center text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 overflow-hidden ${
                plan.highlighted
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 border border-purple-800 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-lg hover:shadow-purple-500/30'
                  : 'border border-gray-300 text-gray-700 hover:border-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10">{plan.cta}</span>
            </motion.a>
            
            {/* Decorative corner elements */}
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-gray-300 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-gray-300 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="text-center mt-8 sm:mt-12 lg:mt-16 px-4"
      >
        <motion.a
          href={isLoggedIn ? "/dashboard" : "/register"}
          whileHover={{ 
            scale: 1.08,
            boxShadow: "0 20px 60px rgba(234, 179, 8, 0.3)",
            transition: { duration: 0.3 }
          }}
          whileTap={{ scale: 0.95 }}
          className="inline-block px-6 sm:px-12 py-3 sm:py-4 bg-purple-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-lg shadow-purple-500/30 cursor-pointer"
        >
          Start Learning Free — No Credit Card Required
        </motion.a>
      </motion.div>
    </div>
  );
}

