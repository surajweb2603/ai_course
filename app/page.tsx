'use client';

import Hero from '@/components/Hero';
import Section from '@/components/Section';
import FeatureGrid from '@/components/FeatureGrid';
import Benefits from '@/components/Benefits';
import HowItWorks from '@/components/HowItWorks';
import StudyTips from '@/components/StudyTips';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import PricingCTA from '@/components/PricingCTA';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      
      <FeatureGrid />
      
      <Section id="benefits" className="bg-white">
        <Benefits />
      </Section>
      
      <Section id="how" className="bg-white">
        <HowItWorks />
      </Section>
      
      <Section id="tips" className="bg-white">
        <StudyTips />
      </Section>
      
      <Testimonials />
      
      <FAQ />
      
      <PricingCTA />

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p className="text-sm sm:text-base">&copy; 2025 AiCourse Generator. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
