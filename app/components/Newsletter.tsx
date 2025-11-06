'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    setEmail('');
  };

  return (
    <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8"
        >
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
              Get Instant Updates
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full md:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base"
            />
            <button
              type="submit"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-purple-800 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

