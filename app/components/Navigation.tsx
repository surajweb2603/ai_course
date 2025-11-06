'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, clearToken } from '@/lib/auth';
import Link from 'next/link';

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const token = getToken();
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg">
              C
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              AICOURSE
            </span>
          </Link>
          
          {/* Desktop Navigation - Only show on large screens (1024px+) */}
          <div className="hidden lg:flex items-center gap-1">
            <Link 
              href="/" 
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                pathname === '/' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/features" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/about" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              About Us
            </Link>
            
            {/* Divider */}
            <div className="w-px h-6 mx-2 bg-gray-300"></div>
            
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  /* Logged In - Show Dashboard and Logout */
                  <>
                    <Link 
                      href="/dashboard" 
                      className="px-6 py-2.5 text-sm font-semibold text-purple-700 hover:text-purple-800 transition-colors"
                    >
                      Dashboard
                    </Link>
                    
                    <button 
                      onClick={handleLogout}
                      className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  /* Not Logged In - Show Login and Register */
                  <>
                    <Link 
                      href="/login" 
                      className="px-6 py-2.5 text-sm font-semibold text-purple-700 hover:text-purple-800 transition-colors"
                    >
                      Login
                    </Link>
                    
                    <Link 
                      href="/register" 
                      className="px-6 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Register
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button - Show on mobile and tablet (up to 1024px) */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-purple-600 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg transition-colors z-50 relative"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            type="button"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu - Show on mobile and tablet (up to 1024px) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-4 sm:px-6 pt-3 pb-5 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <Link 
                href="/" 
                className={`block px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-medium rounded-lg transition-colors ${
                  pathname === '/' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/features" 
                className="block px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className="block px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/about" 
                className="block px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
              
              <div className="border-t border-gray-200 my-2"></div>
              
              {!isLoading && (
                <>
                  {isLoggedIn ? (
                    <>
                      <Link 
                        href="/dashboard" 
                        className="block px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-purple-700 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        href="/login" 
                        className="block px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-purple-700 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      
                      <Link 
                        href="/register" 
                        className="block px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-md text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

