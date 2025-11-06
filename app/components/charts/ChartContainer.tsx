'use client';

import { motion } from 'framer-motion';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function ChartContainer({ title, children, className = '' }: ChartContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}
