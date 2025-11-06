'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

const faqs = [
  {
    question: 'How do I create my first course?',
    answer: 'Simply sign up for a free account, click "Create Course", enter your topic, and our AI will generate a complete course structure with lessons, examples, and quizzes in minutes. You can customize subtopics to focus on specific areas.'
  },
  {
    question: 'Is there a limit on how many courses I can create?',
    answer: 'Free users can create 1 course with 2 modules. Pro users get unlimited courses and modules, plus access to premium features like the AI tutor, video integration, and detailed progress tracking.'
  },
  {
    question: 'How does the AI tutor work?',
    answer: 'The AI tutor is available 24/7 in Pro plans. Simply ask questions about any course content, and get instant explanations, examples, and guidance. It understands context from your current lesson and provides personalized help.'
  },
  {
    question: 'Can I share my courses with others?',
    answer: 'Yes! All plans include course sharing. You can generate a shareable link and send it to friends, classmates, or colleagues. They can view and learn from your courses without needing an account.'
  },
  {
    question: 'What subjects can I learn?',
    answer: 'You can learn virtually any subject! Popular categories include Programming, Business, Creative Arts, Languages, Health & Wellness, and Academic subjects. Just enter any topic, and our AI creates a tailored course.'
  },
  {
    question: 'Do I get a certificate when I complete a course?',
    answer: 'Yes! Pro users receive a downloadable PDF certificate with a QR code when they complete a course. This certificate can be shared on LinkedIn, resumes, or portfolios to showcase your new skills.'
  },
  {
    question: 'Can I study on mobile devices?',
    answer: 'Absolutely! Our platform is fully responsive and works seamlessly on phones, tablets, and desktops. Your progress syncs across all devices, so you can study anywhere, anytime.'
  },
  {
    question: 'How accurate is the AI-generated content?',
    answer: 'Our AI uses advanced language models trained on educational content to generate accurate, well-structured courses. Content is reviewed and can be customized. We recommend supplementing with additional resources for specialized or advanced topics.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 bg-white">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="text-center mb-8 sm:mb-12 lg:mb-16"
      >
        <div className="flex justify-center mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <div className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
              FAQ
            </div>
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-bold text-gray-900 mb-4 sm:mb-6 px-4">
          Frequently Asked Questions
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mt-4 sm:mt-6 px-4">
          If you can't find what you are looking for please send an email to{' '}
          <a href="mailto:support@courseai.com" className="text-purple-600 underline hover:text-purple-700">
            support@courseai.com!
          </a>
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-2 px-4">
        {faqs.map((faq, index) => {
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
              whileHover={{ scale: openIndex === index ? 1 : 1.01 }}
              className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                openIndex === index 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 shadow-xl ring-2 ring-purple-300' 
                  : 'bg-white border border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              {/* Gradient overlay for closed state */}
              {openIndex !== index && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-purple-50/0 to-purple-50/0 hover:from-purple-50/20 hover:via-purple-50/15 hover:to-purple-50/20 transition-all duration-500 rounded-lg" />
              )}
              
              {/* Glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg blur-xl opacity-0 hover:opacity-20 transition-opacity duration-500 -z-10 ${
                openIndex === index ? 'opacity-30' : ''
              }`} />
              <button
                onClick={() => toggleFAQ(index)}
                className="relative z-10 w-full p-4 sm:p-6 flex items-center justify-between text-left gap-3 sm:gap-4 group"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Icon indicator */}
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    openIndex === index 
                      ? 'bg-white/20 text-white' 
                      : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
                  }`}>
                    {openIndex === index ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold flex-1 ${
                    openIndex === index ? 'text-white' : 'text-gray-900 group-hover:text-purple-600 transition-colors duration-300'
                  }`}>
                    {faq.question}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0, scale: openIndex === index ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex-shrink-0 rounded-full p-1 transition-colors duration-300 ${
                    openIndex === index ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-purple-100'
                  }`}
                >
                  {openIndex === index ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </motion.div>
              </button>
              
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden relative"
              >
                {/* Decorative line */}
                {openIndex === index && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="h-px bg-white/30 mb-4 mx-4 sm:mx-6"
                  />
                )}
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10">
                  <p className="text-white leading-relaxed text-sm sm:text-base">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

