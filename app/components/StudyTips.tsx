'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { Brain, TrendingUp, Users, Sparkles } from 'lucide-react';

type StudyTip = {
  icon: typeof Brain;
  title: string;
  description: string;
  color: string;
};

const STUDY_TIPS: StudyTip[] = [
  {
    icon: Brain,
    title: 'Active Learning',
    description: 'Engage with the material actively. Take notes, complete quizzes, and use the AI tutor to deepen your understanding.',
    color: 'text-purple-400'
  },
  {
    icon: TrendingUp,
    title: 'Track Your Progress',
    description: 'Monitor your learning journey. Celebrate small wins and use progress data to identify areas that need more focus.',
    color: 'text-yellow-400'
  },
  {
    icon: Users,
    title: 'Share and Discuss',
    description: 'Share your courses with peers or study groups. Discussing concepts helps reinforce learning and gain new perspectives.',
    color: 'text-pink-400'
  }
];

export default function StudyTips() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 bg-white">
      <StudyTipsHeader />
      <StudyTipsGrid />
      <StudyTipsProTip />
    </div>
  );
}

function StudyTipsHeader() {
  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate" className="text-center mb-8 sm:mb-12 lg:mb-16">
      <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
        <div className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">Study Tips</div>
      </div>
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-bold text-gray-900 mb-4 sm:mb-6 px-4">
        Study Tips for Success
      </h2>
      <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
        Proven strategies to maximize your learning potential and achieve your study goals faster
      </p>
    </motion.div>
  );
}

function StudyTipsGrid() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
    >
      {STUDY_TIPS.map((tip, index) => (
        <StudyTipCard key={tip.title} tip={tip} index={index} />
      ))}
    </motion.div>
  );
}

function StudyTipCard({ tip, index }: { tip: StudyTip; index: number }) {
  const Icon = tip.icon;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -12, scale: 1.04, transition: { duration: 0.3, ease: 'easeOut' } }}
      animate={{
        y: [0, -6, 0],
        transition: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 },
      }}
      className="relative bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 group cursor-pointer shadow-sm overflow-hidden"
    >
      <StudyTipCardDecorations />
      <div className="relative z-10 flex items-start gap-3 sm:gap-4">
        <StudyTipIcon Icon={Icon} color={tip.color} />
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-purple-600 transition-colors duration-300">
            {tip.title}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
            {tip.description}
          </p>
        </div>
      </div>
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-purple-200 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

function StudyTipCardDecorations() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-purple-50/0 to-purple-50/0 group-hover:from-purple-50/40 group-hover:via-purple-50/30 group-hover:to-purple-50/40 transition-all duration-500 rounded-xl" />
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl blur-xl opacity-0 group-hover:opacity-25 transition-opacity duration-500 -z-10" />
    </>
  );
}

function StudyTipIcon({ Icon, color }: { Icon: typeof Brain; color: string }) {
  return (
    <motion.div
      className="relative flex-shrink-0 p-2 sm:p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 group-hover:from-purple-200 group-hover:to-purple-100 transition-all duration-300"
      whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 rounded-xl bg-purple-300 opacity-0 group-hover:opacity-30 group-hover:animate-ping" />
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color} relative z-10`} />
    </motion.div>
  );
}

function StudyTipsProTip() {
  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate" className="mt-8 sm:mt-12 lg:mt-16 max-w-4xl mx-auto px-4">
      <motion.div
        className="relative bg-white rounded-xl p-6 sm:p-8 group cursor-pointer overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300"
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.3 }}
      >
        <StudyTipsProTipContent />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-gray-300 rounded-tr-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-gray-300 rounded-bl-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
    </motion.div>
  );
}

function StudyTipsProTipContent() {
  return (
    <div className="relative z-10 flex items-start gap-3 sm:gap-4">
      <motion.div
        className="relative flex-shrink-0 p-2 sm:p-3 rounded-xl bg-gray-100 shadow-lg"
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 relative z-10" />
      </motion.div>
      <div className="flex-1">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 transition-colors duration-300">
          Pro Tip: Use Your AI Tutor Effectively
        </h3>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed transition-colors duration-300">
          Don't hesitate to ask questions! Your AI tutor is available 24/7 to help clarify concepts, provide examples, and guide your learning. The more you interact, the better your understanding becomes. Treat it like a personal study partner that never gets tired.
        </p>
      </div>
    </div>
  );
}

