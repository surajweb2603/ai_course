'use client';

import { useEffect, useRef } from 'react';

export default function ParallaxBackdrop() {
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      if (blob1Ref.current) {
        blob1Ref.current.style.transform = `translateY(${scrollY * 0.08}px)`;
      }
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translateY(${scrollY * 0.14}px)`;
      }
      if (blob3Ref.current) {
        blob3Ref.current.style.transform = `translateY(${scrollY * 0.1}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
      {/* Blob 1 - Purple */}
      <div 
        ref={blob1Ref}
        className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full opacity-30 blur-[120px] transition-transform duration-100"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(168, 85, 247, 0) 70%)'
        }}
      />

      {/* Blob 2 - Indigo */}
      <div 
        ref={blob2Ref}
        className="absolute top-[30%] right-[10%] w-[600px] h-[600px] rounded-full opacity-25 blur-[130px] transition-transform duration-100"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0) 70%)'
        }}
      />

      {/* Blob 3 - Fuchsia */}
      <div 
        ref={blob3Ref}
        className="absolute bottom-[20%] left-[40%] w-[450px] h-[450px] rounded-full opacity-20 blur-[110px] transition-transform duration-100"
        style={{
          background: 'radial-gradient(circle, rgba(217, 70, 239, 0.4) 0%, rgba(217, 70, 239, 0) 70%)'
        }}
      />
    </div>
  );
}
