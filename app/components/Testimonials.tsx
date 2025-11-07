'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

const testimonials: Testimonial[] = [
  {
    quote: 'I mastered Python programming in just a few weeks! The AI tutor helped me understand concepts I struggled with, and the structured lessons made learning so much easier.',
    name: 'Alex P.',
    role: 'Computer Science Student',
    initials: 'AP'
  },
  {
    quote: 'The best study tool I\'ve used. Created a custom course on digital marketing and completed it with detailed notes and quizzes. The progress tracking kept me motivated!',
    name: 'Sarah M.',
    role: 'Marketing Student',
    initials: 'SM'
  },
  {
    quote: 'As a teacher, I created comprehensive courses for my students. The AI-generated content saved me hours, and my students love the interactive learning experience.',
    name: 'Prof. James K.',
    role: 'University Educator',
    initials: 'JK'
  },
  {
    quote: 'AICourse has been absolutely essential to my journey as a content creator. Thanks to it, I\'ve managed to produce 2-4 times the number of courses in just half the time!',
    name: 'Mia Williams',
    role: 'Content Creator',
    initials: 'MW'
  },
  {
    quote: 'After graduating high school, I dabbled in different ventures but none proved successful. Thanks to AICourse, I found a solution that enabled me to generate semi-passive income streams.',
    name: 'Mason Robinson',
    role: 'Entrepreneur',
    initials: 'MR'
  }
];

export default function Testimonials() {
  const {
    currentIndex,
    displayedTestimonials,
    setCurrentIndex,
  } = useRotatingTestimonials(testimonials);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 bg-white">
      <TestimonialsHeader />
      <div className="relative max-w-6xl mx-auto px-4">
        <TestimonialsGrid
          currentIndex={currentIndex}
          testimonials={displayedTestimonials}
        />
        <TestimonialsPagination
          activeIndex={currentIndex}
          total={testimonials.length}
          onSelect={setCurrentIndex}
        />
      </div>
    </div>
  );
}

function useRotatingTestimonials(items: Testimonial[]) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [items.length]);

  const displayedTestimonials = [
    items[(currentIndex - 1 + items.length) % items.length],
    items[currentIndex],
    items[(currentIndex + 1) % items.length],
  ];

  return { currentIndex, setCurrentIndex, displayedTestimonials };
}

function TestimonialsHeader() {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className="text-center mb-8 sm:mb-12 lg:mb-16"
    >
      <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
        <div className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
          Testimonials
        </div>
      </div>
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-bold text-gray-900 mb-4 sm:mb-6 px-4">
        Testimonials
      </h2>
    </motion.div>
  );
}

function TestimonialsGrid({
  currentIndex,
  testimonials,
}: {
  currentIndex: number;
  testimonials: Testimonial[];
}) {
  return (
    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
    >
      {testimonials.map((testimonial, index) => (
        <TestimonialCard
          key={`${currentIndex}-${index}`}
          testimonial={testimonial}
          isHighlighted={index === 1}
          motionIndex={index}
        />
      ))}
    </motion.div>
  );
}

function TestimonialCard({
  testimonial,
  isHighlighted,
  motionIndex,
}: {
  testimonial: Testimonial;
  isHighlighted: boolean;
  motionIndex: number;
}) {
  const highlightClasses = isHighlighted
    ? 'border-purple-400 shadow-xl ring-2 ring-purple-200'
    : 'border-gray-200 hover:border-purple-300';

  return (
    <motion.div
      variants={fadeUp}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -12, scale: 1.04, transition: { duration: 0.3, ease: 'easeOut' } }}
      className={`relative bg-white border-2 rounded-xl p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden ${highlightClasses}`}
    >
      <CardOverlay isHighlighted={isHighlighted} />
      <div className="relative z-10 flex flex-col h-full">
        <CardHeader name={testimonial.name} />
        <StarRating motionIndex={motionIndex} />
        <CardQuote quote={testimonial.quote} />
      </div>
    </motion.div>
  );
}

function CardOverlay({ isHighlighted }: { isHighlighted: boolean }) {
  const gradientClasses = isHighlighted
    ? 'from-purple-50/20 via-purple-50/15 to-purple-50/20'
    : '';
  const glowClasses = isHighlighted ? 'opacity-15' : '';

  return (
    <>
      <div
        className={`absolute inset-0 bg-gradient-to-br from-purple-50/0 via-purple-50/0 to-purple-50/0 hover:from-purple-50/30 hover:via-purple-50/20 hover:to-purple-50/30 transition-all duration-500 rounded-xl ${gradientClasses}`}
      />
      <div
        className={`absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl blur-xl opacity-0 hover:opacity-25 transition-opacity duration-500 -z-10 ${glowClasses}`}
      />
    </>
  );
}

function CardHeader({ name }: { name: string }) {
  return (
    <div className="mb-2 sm:mb-3">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-purple-600 transition-colors duration-300">
        {name}
      </h3>
    </div>
  );
}

function CardQuote({ quote }: { quote: string }) {
  return (
    <div className="flex-grow mb-3 sm:mb-4">
      <p className="text-gray-700 leading-relaxed text-xs sm:text-sm group-hover:text-gray-900 transition-colors duration-300">
        &quot;{quote}&quot;
      </p>
      <div className="absolute top-2 left-2 text-purple-200 opacity-20 text-4xl font-serif">&quot;</div>
      <div className="absolute bottom-2 right-2 text-purple-200 opacity-20 text-4xl font-serif rotate-180">&quot;</div>
    </div>
  );
}

function StarRating({ motionIndex }: { motionIndex: number }) {
  return (
    <div className="flex gap-0.5 sm:gap-1 mb-2 sm:mb-3">
      {[...Array(5)].map((_, i) => (
        <motion.svg
          key={`${motionIndex}-${i}`}
          className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current"
          viewBox="0 0 20 20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.2, rotate: 180 }}
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </motion.svg>
      ))}
    </div>
  );
}

function TestimonialsPagination({
  activeIndex,
  total,
  onSelect,
}: {
  activeIndex: number;
  total: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex justify-center gap-2 mt-8">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            index === activeIndex ? 'bg-purple-600 w-8' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

