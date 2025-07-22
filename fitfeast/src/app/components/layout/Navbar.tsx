'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import UserNameManager from '../UserNameManager';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Handle scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', requiresAuth: true },
    { name: 'Meal Planning', path: '/meal-plans', requiresAuth: true },
    { name: 'Health Tracking', path: '/health-tracker', requiresAuth: true },
    { name: 'Community', path: '/community', requiresAuth: true },
  ];

  interface NavItem {
    name: string;
    path: string;
    requiresAuth: boolean;
  }

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold text-emerald-600">FitFeast</Link>
          <span className="hidden md:inline-block px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold ml-2">Health & Nutrition</span>
          <div className="hidden md:flex gap-4 ml-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${pathname.startsWith(item.path) ? 'bg-emerald-500 text-white' : 'text-gray-700 hover:bg-emerald-100'}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <span className="text-gray-700 text-sm">{session.user.name || session.user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;