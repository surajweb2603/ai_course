'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { Bot, BookOpen, Search, Video, MessageCircle, BarChart3, LucideIcon, Sparkles } from 'lucide-react';

const features = [
  {
    title: 'Instant Course Creation',
    body: 'Turn any topic into a complete course in minutes. AI generates structured lessons, modules, and quizzes tailored to your learning goals.',
    icon: Bot,
    gradient: 'from-purple-500 to-indigo-600'
  },
  {
    title: 'Comprehensive Study Materials',
    body: 'Get detailed explanations, real-world examples, and practice exercises. Learn deeply with content designed to help you master concepts.',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-600'
  },
  {
    title: 'Visual Learning Support',
    body: 'Automatically find educational images and diagrams that make complex topics easier to understand. Visual aids enhance your learning experience.',
    icon: Search,
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    title: 'Video Lessons Included',
    body: 'Watch curated educational videos that complement your studies. AI selects the best video content to reinforce what you\'re learning.',
    icon: Video,
    gradient: 'from-red-500 to-pink-600'
  },
  {
    title: '24/7 AI Study Tutor',
    body: 'Stuck on a concept? Ask your AI tutor anytime. Get instant explanations, study tips, and personalized guidance to help you succeed.',
    icon: MessageCircle,
    gradient: 'from-orange-500 to-amber-600'
  },
  {
    title: 'Track Your Progress',
    body: 'See how far you\'ve come with detailed analytics. Monitor completion rates, quiz performance, and learning milestones on your journey.',
    icon: BarChart3,
    gradient: 'from-teal-500 to-blue-600'
  }
];

interface FeatureCardProps {
  feature: {
    title: string;
    body: string;
    icon: LucideIcon;
    gradient: string;
  };
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
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
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_70%)]" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Large icon with gradient background */}
        <motion.div
          className={`relative mb-6 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow duration-300`}
          whileHover={{ 
            scale: 1.1,
            rotate: [0, -5, 5, 0],
            transition: { duration: 0.5 }
          }}
        >
          <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          
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
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300">
          {feature.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 leading-relaxed text-base sm:text-lg group-hover:text-gray-700 transition-colors duration-300 max-w-sm">
          {feature.body}
        </p>
        
        {/* Decorative line */}
        <motion.div
          className={`mt-6 h-1 w-16 rounded-full bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          initial={{ width: 0 }}
          whileHover={{ width: 64 }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Corner accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-bl-full transition-opacity duration-500`} />
    </motion.div>
  );
}

export default function FeatureGrid() {
  return (
    <div className="relative bg-gradient-to-b from-white via-purple-50/30 to-white py-12 sm:py-16 lg:py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <div className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
              Powerful Features
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-bold text-gray-900 mb-4 sm:mb-6 px-4 leading-tight">
            Set Up & Host The Online Course With AICourse
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
