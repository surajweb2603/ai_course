'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { Bot, Globe, MessageCircle, GraduationCap, BarChart3, Video, User, Search, BookOpen, Sparkles, Zap, Lock, Smartphone, Palette } from 'lucide-react';
import { getToken } from '@/lib/auth';

const mainFeatures = [
  {
    icon: Bot,
    title: 'AI Course Generation',
    description: 'Generate complete course outlines with modules, lessons, and quizzes in minutes. Our AI creates structured educational content tailored to your topic.',
    highlights: [
      'Instant course outline generation',
      'Structured lesson creation',
      'Auto-generated quizzes',
      'Topic-specific content',
    ],
  },
  {
    icon: BookOpen,
    title: 'Smart Content Creation',
    description: 'AI writes detailed lesson content with examples, explanations, and practical exercises. Get comprehensive educational material without manual work.',
    highlights: [
      'Detailed lesson writing',
      'Example generation',
      'Exercise creation',
      'Educational explanations',
    ],
  },
  {
    icon: MessageCircle,
    title: 'AI Tutor Chat',
    description: 'Get instant help with our AI tutor. Ask questions about course content and receive detailed explanations and guidance.',
    highlights: [
      'Instant responses',
      'Context-aware answers',
      'Educational guidance',
      'Topic expertise',
    ],
  },
  {
    icon: GraduationCap,
    title: 'Progress Tracking',
    description: 'Monitor learning progress with detailed analytics. Track completion rates, quiz scores, and course engagement.',
    highlights: [
      'Completion tracking',
      'Quiz score analytics',
      'Progress visualization',
      'Learning insights',
    ],
  },
  {
    icon: Search,
    title: 'Auto Image Search',
    description: 'Automatically find and integrate relevant educational images. AI searches for appropriate visuals to enhance course content.',
    highlights: [
      'Educational image search',
      'Automatic integration',
      'Visual content enhancement',
      'Relevant image curation',
    ],
  },
  {
    icon: Video,
    title: 'Video Integration',
    description: 'Embed educational videos from YouTube to complement lessons. AI finds relevant video content for each topic automatically.',
    highlights: [
      'YouTube video integration',
      'Educational video search',
      'Automatic video curation',
      'Enhanced learning experience',
    ],
  },
];

const additionalFeatures = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Generate complete courses in under 5 minutes',
    gradient: 'from-yellow-500 to-orange-600',
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    description: 'Enterprise-grade security for your data',
    gradient: 'from-amber-500 to-yellow-600',
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Learn anywhere on any device',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Palette,
    title: 'Customizable',
    description: 'Tailor courses to your brand and style',
    gradient: 'from-pink-500 to-purple-600',
  },
];

const useCases = [
  {
    title: 'For Educators',
    description: 'Create engaging courses faster than ever. Focus on teaching while AI handles content creation.',
    icon: User,
    benefits: ['Save 80% course creation time', 'Reach global audiences', 'Automate assessments'],
  },
  {
    title: 'For Students',
    description: 'Learn at your own pace with personalized AI guidance. Access courses in your native language.',
    icon: GraduationCap,
    benefits: ['24/7 AI tutor support', 'Personalized learning paths', 'Earn verified certificates'],
  },
];

const comparisonFeatures = [
  { feature: 'AI Course Generation', us: true, others: false },
  { feature: 'Multi-Language Support (23+)', us: true, others: 'Limited' },
  { feature: '24/7 AI Tutor', us: true, others: false },
  { feature: 'Automated Assessments', us: true, others: 'Manual' },
  { feature: 'Video Integration', us: true, others: true },
  { feature: 'Certificates', us: true, others: true },
  { feature: 'Analytics Dashboard', us: true, others: 'Basic' },
  { feature: 'Setup Time', us: '5 minutes', others: 'Hours/Days' },
];

export default function FeaturesPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/40 pt-16 sm:pt-20">
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
              className="inline-block mb-6"
            >
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
                  Powerful Features
                </div>
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[2.75rem] xl:text-8xl font-bold text-gray-900 mb-8 leading-[1.1] sm:leading-[0.95] tracking-tight overflow-visible"
            >
              Powerful Features for{' '}
              <span className="relative inline-block italic font-light bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 bg-clip-text text-transparent overflow-visible px-2 -mx-1">
                Modern Learning
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[1.1rem] sm:text-[1.2375rem] md:text-[1.375rem] text-gray-600 leading-relaxed max-w-3xl mx-auto font-medium"
            >
              Everything you need to create, deliver, and scale world-class educational content powered by artificial intelligence.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="relative bg-gradient-to-b from-white via-purple-50/30 to-white py-12 sm:py-16 lg:py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={fadeUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <div className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
                Core Features
              </div>
            </div>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: false, amount: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {mainFeatures.map((feature, index) => {
              const gradients = [
                'from-purple-500 to-indigo-600',
                'from-blue-500 to-cyan-600',
                'from-green-500 to-emerald-600',
                'from-red-500 to-pink-600',
                'from-orange-500 to-amber-600',
                'from-teal-500 to-blue-600'
              ];
              const gradient = gradients[index % gradients.length];
              
              return (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ 
                    opacity: 1, 
                    y: 0,
                  }}
                  viewport={{ once: false }}
                  transition={{
                    duration: 0.7,
                    delay: index * 0.1,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                  whileHover={{ 
                    y: -16,
                    transition: { duration: 0.4, ease: "easeOut" }
                  }}
                  className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 sm:p-10 transition-all duration-300 group cursor-pointer overflow-hidden border border-gray-100 shadow-md hover:shadow-2xl"
                >
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_70%)]" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col">
                    {/* Large icon with gradient background */}
                    <motion.div
                      className={`relative mb-6 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow duration-300`}
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <feature.icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                      
                      {/* Animated ring effect */}
                      <motion.div
                        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-30 blur-xl`}
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0, 0.3, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                    
                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300 text-base sm:text-lg">
                      {feature.description}
                    </p>

                    {/* Highlights */}
                    <ul className="space-y-2">
                      {feature.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                          <svg className={`w-4 h-4 flex-shrink-0 text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                    
                    {/* Decorative line */}
                    <motion.div
                      className={`mt-6 h-1 w-16 rounded-full bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      initial={{ width: 0 }}
                      whileHover={{ width: 64 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  
                  {/* Corner accent */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-bl-full transition-opacity duration-500`} />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <div className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
                Bonus Features
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              And Much More
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Packed with features to make your learning experience exceptional
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: false, amount: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0,
                }}
                viewport={{ once: false }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.1,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                whileHover={{ 
                  y: -12,
                  scale: 1.05,
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
                className="relative bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 sm:p-8 transition-all duration-300 group cursor-pointer text-center shadow-sm hover:shadow-2xl hover:border-purple-300 overflow-hidden"
              >
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_70%)]" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  {/* Icon with enhanced animation */}
                  <motion.div
                    className={`relative mb-6 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow duration-300`}
                    whileHover={{ 
                      scale: 1.2,
                      rotate: [0, -10, 10, -10, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                        ease: "easeInOut"
                      }}
                    >
                      <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </motion.div>
                    
                    {/* Animated ring effect */}
                    <motion.div
                      className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-30 blur-xl`}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0, 0.3, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  
                  {/* Title */}
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-300">
                    {feature.title}
                  </h4>
                  
                  {/* Description */}
                  <p className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  {/* Decorative accent line */}
                  <motion.div
                    className={`mt-4 h-1 w-12 rounded-full bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    initial={{ width: 0 }}
                    whileHover={{ width: 48 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-bl-full transition-opacity duration-500`} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
              <span className="text-xs tracking-widest text-purple-600 font-medium uppercase">
                FOR EVERYONE
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Built For Everyone
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No matter your role, we have features designed for you
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                whileHover={{ y: -10, scale: 1.02 }}
                className="transition-all duration-300 bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-lg group cursor-pointer"
                style={{ borderRadius: 16 }}
              >
                <div className="flex items-start gap-6">
                  <div className="text-6xl group-hover:scale-110 transition-transform duration-300 text-purple-600">
                    <useCase.icon className="w-16 h-16" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors duration-300">
                      {useCase.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {useCase.description}
                    </p>
                    <ul className="space-y-2">
                      {useCase.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                          <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
              <span className="text-xs tracking-widest text-purple-600 font-medium uppercase">
                COMPARISON
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              How We Compare
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See why AiCourse Generator stands out from the competition
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg"
          >
            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
              <div className="text-gray-700 font-medium">Feature</div>
              <div className="text-center">
                <div className="text-purple-600 font-bold text-lg">AiCourse</div>
                <div className="text-xs text-gray-600">Generator</div>
              </div>
              <div className="text-center text-gray-700 font-medium">Others</div>
            </div>

            {comparisonFeatures.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-3 gap-4 p-6 border-b border-gray-200 hover:bg-purple-50 transition-colors duration-200"
              >
                <div className="text-gray-700 text-sm">{item.feature}</div>
                <div className="text-center">
                  {typeof item.us === 'boolean' ? (
                    item.us ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )
                  ) : (
                    <span className="text-purple-600 font-medium text-sm">{item.us}</span>
                  )}
                </div>
                <div className="text-center">
                  {typeof item.others === 'boolean' ? (
                    item.others ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )
                  ) : (
                    <span className="text-gray-600 text-sm">{item.others}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-3xl p-12"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
              <span className="text-xs tracking-widest text-purple-600 font-medium uppercase">
                GET STARTED
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Experience These Features?
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Start creating amazing courses today with our AI-powered platform. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href={isLoggedIn ? "/dashboard" : "/register"}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 60px rgba(107, 33, 168, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                className="inline-block px-12 py-4 bg-purple-600 text-white text-base font-semibold rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-lg cursor-pointer"
              >
                Start Free Trial
              </motion.a>
              <motion.a
                href="/about"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block px-12 py-4 border-2 border-purple-600 text-purple-600 text-base font-semibold rounded-lg hover:bg-purple-50 transition-all duration-300 cursor-pointer"
              >
                Learn More
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p className="text-sm sm:text-base">&copy; 2025 AiCourse Generator. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

