"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/meal-plans', label: 'Meal Planning', icon: '🍽️' },
  { href: '/health-tracker', label: 'Health Tracking', icon: '❤️' },
  { href: '/community', label: 'Community', icon: '👥' },
];

export default function FitFeastLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname() ?? '';
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-2 rounded-xl">
                  <span className="text-xl font-bold">FF</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-800">FitFeast</span>
                  <span className="text-xs text-emerald-600 bg-emerald-100 rounded px-2 py-1 ml-2">Health & Nutrition</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu & Mobile Menu Button */}
            <div className="flex items-center gap-4">
              {/* User Profile */}
              {session?.user ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-sm font-medium text-gray-800">{session.user.name || session.user.email}</div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="ml-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-colors text-sm shadow"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/signin"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                >
                  Sign In
                </Link>
              )}
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-2 rounded-xl">
                  <span className="text-lg font-bold">FF</span>
                </div>
                <span className="text-xl font-bold text-gray-800">FitFeast</span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                Your AI-powered meal planning companion. Discover delicious recipes, 
                plan your meals, and achieve your health goals with smart nutrition guidance.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 tracking-wider uppercase mb-4">Features</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-emerald-600 transition-colors">AI Meal Planning</a></li>
                <li><a href="#" className="text-gray-600 hover:text-emerald-600 transition-colors">Recipe Library</a></li>
                <li><a href="#" className="text-gray-600 hover:text-emerald-600 transition-colors">Grocery Lists</a></li>
                <li><a href="#" className="text-gray-600 hover:text-emerald-600 transition-colors">Health Tracking</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 tracking-wider uppercase mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help-center" className="text-gray-600 hover:text-emerald-600 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-emerald-600 transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy-policy" className="text-gray-600 hover:text-emerald-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="text-gray-600 hover:text-emerald-600 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-8 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 FitFeast. All rights reserved. Made with ❤️ for healthy living.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 