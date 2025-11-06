'use client';

import { motion } from 'framer-motion';
import { fadeUp, fadeIn } from '@/lib/animations';

interface SectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  variant?: 'fadeUp' | 'fadeIn';
}

const variants = {
  fadeUp,
  fadeIn
};

export default function Section({ 
  id, 
  className = '', 
  children, 
  variant = 'fadeUp' 
}: SectionProps) {
  const selectedVariant = variants[variant];

  return (
    <section
      id={id}
      className={className}
    >
      {children}
    </section>
  );
}

