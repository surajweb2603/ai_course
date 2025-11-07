'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, clearToken } from '@/lib/auth';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About Us' },
];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isLoading, markLoggedOut } = useNavigationAuth(pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearToken();
    markLoggedOut();
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <NavigationLogo onClick={() => setIsMobileMenuOpen(false)} />
          <NavigationDesktop
            pathname={pathname}
            isLoading={isLoading}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
          <NavigationMobileToggle
            isOpen={isMobileMenuOpen}
            onToggle={() => setIsMobileMenuOpen((prev) => !prev)}
          />
        </div>
        <NavigationMobileMenu
          isOpen={isMobileMenuOpen}
          pathname={pathname}
          isLoading={isLoading}
          isLoggedIn={isLoggedIn}
          onLinkClick={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </nav>
  );
}

function useNavigationAuth(pathname: string) {
  const [state, setState] = useState({ isLoggedIn: false, isLoading: true });

  useEffect(() => {
    const token = getToken();
    setState({ isLoggedIn: !!token, isLoading: false });
  }, [pathname]);

  const markLoggedOut = () => setState({ isLoggedIn: false, isLoading: false });

  return { ...state, markLoggedOut };
}

function NavigationLogo({ onClick }: { onClick: () => void }) {
  return (
    <Link href="/" className="flex items-center gap-2 sm:gap-3 group" onClick={onClick}>
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg">
        C
      </div>
      <span className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
        AICOURSE
      </span>
    </Link>
  );
}

function NavigationDesktop({
  pathname,
  isLoading,
  isLoggedIn,
  onLogout,
}: {
  pathname: string;
  isLoading: boolean;
  isLoggedIn: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="hidden lg:flex items-center gap-1">
      <NavigationLinks pathname={pathname} orientation="desktop" onLinkClick={() => undefined} />
      <div className="w-px h-6 mx-2 bg-gray-300" />
      {!isLoading && (
        <NavigationAuthButtons isLoggedIn={isLoggedIn} onLogout={onLogout} variant="desktop" />
      )}
    </div>
  );
}

function NavigationMobileToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-purple-600 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg transition-colors z-50 relative"
      aria-label="Toggle mobile menu"
      aria-expanded={isOpen}
      type="button"
    >
      {isOpen ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </button>
  );
}

function NavigationMobileMenu({
  isOpen,
  pathname,
  isLoading,
  isLoggedIn,
  onLinkClick,
  onLogout,
}: {
  isOpen: boolean;
  pathname: string;
  isLoading: boolean;
  isLoggedIn: boolean;
  onLinkClick: () => void;
  onLogout: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
      <div className="px-4 sm:px-6 pt-3 pb-5 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <NavigationLinks pathname={pathname} orientation="mobile" onLinkClick={onLinkClick} />
        <div className="border-t border-gray-200 my-2" />
        {!isLoading && (
          <NavigationAuthButtons
            isLoggedIn={isLoggedIn}
            onLogout={onLogout}
            variant="mobile"
            onLinkClick={onLinkClick}
          />
        )}
      </div>
    </div>
  );
}

function NavigationLinks({
  pathname,
  orientation,
  onLinkClick,
}: {
  pathname: string;
  orientation: 'desktop' | 'mobile';
  onLinkClick: () => void;
}) {
  const baseClass = orientation === 'desktop'
    ? 'px-4 py-2 text-sm font-medium'
    : 'block px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-medium';

  return (
    <>
      {NAV_LINKS.map((link) => {
        const isActive = pathname === link.href;
        const activeClass = isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50';

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${baseClass} ${activeClass} rounded-lg transition-colors`}
            onClick={onLinkClick}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function NavigationAuthButtons({
  isLoggedIn,
  onLogout,
  variant,
  onLinkClick,
}: {
  isLoggedIn: boolean;
  onLogout: () => void;
  variant: 'desktop' | 'mobile';
  onLinkClick?: () => void;
}) {
  if (isLoggedIn) {
    return (
      <NavigationLoggedInButtons
        variant={variant}
        onLogout={onLogout}
        onLinkClick={onLinkClick}
      />
    );
  }

  return <NavigationGuestButtons variant={variant} onLinkClick={onLinkClick} />;
}

function NavigationLoggedInButtons({
  variant,
  onLogout,
  onLinkClick,
}: {
  variant: 'desktop' | 'mobile';
  onLogout: () => void;
  onLinkClick?: () => void;
}) {
  const baseClass = variant === 'desktop'
    ? 'px-6 py-2.5 text-sm font-semibold'
    : 'block px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-semibold';

  return (
    <>
      <Link
        href="/dashboard"
        className={`${baseClass} text-purple-700 hover:text-purple-800 transition-colors`}
        onClick={onLinkClick}
      >
        Dashboard
      </Link>
      <button
        onClick={onLogout}
        className={`${baseClass} text-gray-700 hover:text-gray-900 transition-colors ${variant === 'mobile' ? 'hover:bg-gray-50 rounded-lg text-left w-full' : ''}`}
      >
        Logout
      </button>
    </>
  );
}

function NavigationGuestButtons({
  variant,
  onLinkClick,
}: {
  variant: 'desktop' | 'mobile';
  onLinkClick?: () => void;
}) {
  const baseClass = variant === 'desktop'
    ? 'px-6 py-2.5 text-sm font-semibold'
    : 'block px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-semibold';

  return (
    <>
      <Link
        href="/login"
        className={`${baseClass} text-purple-700 hover:text-purple-800 transition-colors ${variant === 'mobile' ? 'hover:bg-purple-50 rounded-lg' : ''}`}
        onClick={onLinkClick}
      >
        Login
      </Link>
      <Link
        href="/register"
        className={`${baseClass} bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-md hover:shadow-lg ${variant === 'desktop' ? '' : 'text-center'}`}
        onClick={onLinkClick}
      >
        Register
      </Link>
    </>
  );
}

