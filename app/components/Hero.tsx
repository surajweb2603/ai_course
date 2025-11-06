'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fadeUp } from '@/lib/animations';
import { GraduationCap, Sparkles, Users, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import { getToken } from '@/lib/auth';

export default function Hero() {
  const [imageError, setImageError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/40 pt-16 sm:pt-20">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-300 rounded-full blur-[140px] opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-purple-100/40 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full blur-[120px] opacity-20"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 relative z-10 overflow-visible">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="space-y-6 sm:space-y-8 lg:pr-12 text-center lg:text-left overflow-visible"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200/50 shadow-sm backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
              </motion.div>
              <div className="text-xs tracking-widest text-purple-600 font-semibold uppercase">
                Start Learning Today
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[2.75rem] xl:text-8xl font-bold text-gray-900 leading-[1.1] sm:leading-[0.95] tracking-tight overflow-visible"
            >
              Master Any{' '}
              <span className="relative inline-block italic font-light bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 bg-clip-text text-transparent overflow-visible px-2 -mx-1">
                Subject
              </span>
              {' '}with AI
            </motion.h1>
            
            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[1.1rem] sm:text-[1.2375rem] md:text-[1.375rem] text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium"
            >
              Create personalized courses, learn at your own pace, and get instant help from your AI tutor. Turn any topic into a complete learning experience.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 sm:pt-4"
            >
              <Link href={isLoggedIn ? "/dashboard" : "/register"} className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 25px 50px rgba(139, 92, 246, 0.4)",
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-xl shadow-purple-500/40 cursor-pointer font-semibold text-sm sm:text-base overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                  <span className="relative z-10">Start Learning Free</span>
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300 relative z-10" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              </Link>
              
              <motion.a
                href="/features"
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white/80 backdrop-blur-sm border-2 border-purple-600/50 text-purple-600 rounded-xl hover:bg-white hover:border-purple-600 transition-all duration-300 cursor-pointer font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                Explore Features
                <svg 
                  className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-y-1 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 pt-6 sm:pt-8"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="text-center lg:text-left px-4 py-3 rounded-xl bg-white/60 backdrop-blur-sm border border-purple-100/50 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 justify-center lg:justify-start mb-1">
                  <Users className="w-4 h-4 text-purple-600" />
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">1000+</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Active Learners</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="text-center lg:text-left px-4 py-3 rounded-xl bg-white/60 backdrop-blur-sm border border-purple-100/50 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 justify-center lg:justify-start mb-1">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">500+</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Courses Created</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="text-center lg:text-left px-4 py-3 rounded-xl bg-white/60 backdrop-blur-sm border border-purple-100/50 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 justify-center lg:justify-start mb-1">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">24/7</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">AI Tutor Support</div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Column - Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] order-first lg:order-last flex items-center justify-center"
          >
            {/* Glow effect behind image */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl -z-10"></div>
            
            {/* Image container with enhanced styling */}
            <motion.div 
              className="relative w-full h-full flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-3xl border border-purple-100/50 shadow-2xl p-4 sm:p-6 md:p-8 max-w-full max-h-full">
                {!imageError ? (
                  <motion.img
                    src="/img.png"
                    alt="AI Course Generator - Modern Learning Platform"
                    className="w-auto h-auto max-w-full max-h-full object-contain relative z-10 drop-shadow-2xl rounded-2xl"
                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                    onError={() => setImageError(true)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg min-w-[200px] min-h-[200px]">
                    <p className="text-gray-500 text-sm">Please add img.png to /public folder</p>
                  </div>
                )}
                
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-purple-300/50 rounded-tl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-blue-300/50 rounded-br-3xl"></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

