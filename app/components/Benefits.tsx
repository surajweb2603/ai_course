'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { Sparkles } from 'lucide-react';

const benefits = [
  'Learn at Your Own Pace — Study when and how you want, with content that adapts to your learning style.',
  'Master Complex Topics — Break down difficult subjects into easy-to-understand lessons with examples and visuals.',
  'Never Study Alone — Get instant help from your AI tutor whenever you need clarification or guidance.',
  'Track Your Success — See your progress in real-time with detailed analytics and learning milestones.',
  'Study Anywhere — Access your courses on any device, anytime. Your learning journey follows you everywhere.'
];

export default function Benefits() {
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
            Why Choose Us
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-bold text-gray-900 mb-4 sm:mb-6 px-4">
          Why Students Love Learning Here
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
          Join thousands of learners who are mastering new skills faster and smarter
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 px-4">
        {benefits.map((benefit, index) => {
          // Determine if card should come from left (even) or right (odd)
          const direction = index % 2 === 0 ? 'left' : 'right';
          
          return (
            <motion.div
              key={index}
              initial={{
                x: direction === 'left' ? -200 : 200,
                opacity: 0,
              }}
              animate={{
                x: 0,
                opacity: 1,
              }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                delay: index * 0.1
              }}
              whileHover={{ 
                x: 12,
                scale: 1.03,
                y: -12,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="relative flex items-start gap-3 sm:gap-4 bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 group cursor-pointer shadow-sm overflow-hidden"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50/0 via-purple-50/0 to-purple-50/0 group-hover:from-purple-50/30 group-hover:via-purple-50/20 group-hover:to-purple-50/30 transition-all duration-500 rounded-xl" />
              
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10" />
              
              <div className="relative z-10 flex items-start gap-3 sm:gap-4 w-full">
                <motion.div 
                  className="relative flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-100 transition-all duration-300"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                    transition: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.3,
                    }
                  }}
                  whileHover={{
                    scale: 1.3,
                    rotate: 360,
                    transition: { duration: 0.5 }
                  }}
                >
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-full bg-purple-300 opacity-0 group-hover:opacity-30 group-hover:animate-ping" />
                  <svg 
                    className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 transition-transform duration-300 relative z-10" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </motion.div>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors duration-300 flex-1">
                  {benefit}
                </p>
              </div>
              
              {/* Decorative corner accent */}
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-purple-200 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

