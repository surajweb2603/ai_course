'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { Sparkles } from 'lucide-react';

const steps = [
  {
    number: '1',
    title: 'Choose What to Study',
    description: 'Pick any subject you want to master. Enter a topic or course title, and optionally add specific areas you want to focus on.'
  },
  {
    number: '2',
    title: 'AI Creates Your Course',
    description: 'Our AI instantly generates a complete course with structured lessons, examples, visuals, and practice quizzes tailored to your needs.'
  },
  {
    number: '3',
    title: 'Start Learning',
    description: 'Dive into interactive lessons, watch educational videos, test your knowledge with quizzes, and get help from your AI tutor anytime.'
  },
  {
    number: '4',
    title: 'Earn Your Certificate',
    description: 'Complete your course and receive a verified certificate to showcase your new skills and knowledge.'
  }
];

export default function HowItWorks() {
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
            How It Works
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-bold text-gray-900 mb-4 sm:mb-6 px-4">
          Start Learning in Minutes
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
          From choosing a topic to earning your certificate—your learning journey starts here
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative px-4"
      >
        {/* Connecting line for desktop */}
        <div className="hidden lg:block absolute top-16 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent z-0" 
             style={{ top: '4rem' }} 
        />

        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: 1,
              y: [30, -20, 0],
              transition: {
                opacity: { duration: 0.3 },
                y: {
                  duration: 0.8,
                  delay: index * 0.15,
                  ease: [0.34, 1.56, 0.64, 1],
                  times: [0, 0.6, 1]
                }
              }
            }}
            whileHover={{ 
              y: -16,
              scale: 1.06,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            className="relative z-10"
          >
            <div className="relative bg-white border border-gray-200 rounded-xl p-4 sm:p-6 h-full hover:border-purple-300 hover:shadow-2xl transition-all duration-300 group cursor-pointer shadow-sm overflow-hidden">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-purple-50/0 to-purple-50/0 group-hover:from-purple-50/40 group-hover:via-purple-50/30 group-hover:to-purple-50/40 transition-all duration-500 rounded-xl" />
              
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl blur-xl opacity-0 group-hover:opacity-25 transition-opacity duration-500 -z-10" />
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-3 sm:space-y-4">
                {/* Number circle with enhanced styling */}
                <motion.div 
                  className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-300 flex items-center justify-center text-lg sm:text-xl font-bold text-purple-600 shadow-lg group-hover:from-purple-200 group-hover:to-purple-100 group-hover:scale-125 group-hover:shadow-purple-300 transition-all duration-300"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-full bg-purple-300 opacity-0 group-hover:opacity-40 group-hover:animate-ping" />
                  <span className="relative z-10">{step.number}</span>
                </motion.div>
                
                {/* Arrow connector for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 via-purple-200 to-transparent opacity-50 -translate-y-1/2 z-0" style={{ width: 'calc(100% + 1.5rem)' }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}
                
                <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm group-hover:text-gray-700 transition-colors duration-300">
                  {step.description}
                </p>
              </div>
              
              {/* Decorative corner elements */}
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-purple-200 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-purple-200 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

