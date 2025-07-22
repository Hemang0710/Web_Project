"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import FitFeastLayout from '../components/layout/FitFeastLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// ✅ Import the new widget
import QuickCalorieChecker from "../components/QuickCalorieChecker";

// Stats interface for type safety
interface Stats {
  totalDaysTracked?: number;
  currentBMI?: number;
  weightTrend?: string;
  averageCalories?: number;
  [key: string]: unknown;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const user = session?.user;
  const signOut = nextAuthSignOut;
  const router = useRouter();

  // Live stats state
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      const res = await fetch('/api/progress/enhanced?stats=true');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
      setLoadingStats(false);
    };
    fetchStats();
  }, []);

  return (
    <ProtectedRoute>
      <FitFeastLayout>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <div className="max-w-screen-2xl mx-auto px-4 py-10 sm:px-8 lg:px-12">
            
            {/* Welcome Section */}
            <div className="bg-white/90 rounded-3xl shadow-xl border border-emerald-100 p-8 mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 animate-fade-in">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl lg:text-3xl">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-emerald-700 mb-2 tracking-tight">
                    Welcome back, {user?.name || 'User'}! <span className="inline-block">👋</span>
                  </h1>
                  <p className="text-gray-500 text-lg">Ready to crush your health goals today?</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="px-6 py-3 text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25"
              >
                Sign Out
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in-up">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 rounded-3xl p-6 flex flex-col items-start shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-2">
                  <span className="text-2xl">🍽️</span>
                </div>
                <span className="text-emerald-500 text-sm font-medium mb-1">This Week</span>
                <h3 className="text-2xl font-bold text-emerald-700 mb-1">{stats?.totalDaysTracked ?? '...'}</h3>
                <p className="text-gray-500">Meal Plans</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 rounded-3xl p-6 flex flex-col items-start shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-2">
                  <span className="text-2xl">📊</span>
                </div>
                <span className="text-blue-500 text-sm font-medium mb-1">Current</span>
                <h3 className="text-2xl font-bold text-blue-700 mb-1">{stats?.currentBMI ?? '...'}</h3>
                <p className="text-gray-500">BMI Score</p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200 rounded-3xl p-6 flex flex-col items-start shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-2">
                  <span className="text-2xl">🎯</span>
                </div>
                <span className="text-purple-500 text-sm font-medium mb-1">Goal</span>
                <h3 className="text-2xl font-bold text-purple-700 mb-1">{stats?.weightTrend ?? '...'}</h3>
                <p className="text-gray-500">Progress</p>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-red-100 border border-orange-200 rounded-3xl p-6 flex flex-col items-start shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-2">
                  <span className="text-2xl">🔥</span>
                </div>
                <span className="text-orange-500 text-sm font-medium mb-1">Today</span>
                <h3 className="text-2xl font-bold text-orange-700 mb-1">{stats?.averageCalories ?? '...'}</h3>
                <p className="text-gray-500">Calories</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
              <div className="bg-white/90 border border-emerald-100 rounded-3xl p-8 hover:border-emerald-400 transition-all duration-300 group shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🍽️</span>
                </div>
                <h2 className="text-2xl font-bold text-emerald-700 mb-4">Meal Planning</h2>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Create personalized meal plans, discover recipes, get AI-powered suggestions, and manage your grocery lists.
                </p>
                <button
                  onClick={() => router.push('/meal-plans')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
                >
                  Open Meal Planning Hub
                </button>
              </div>
              <div className="bg-white/90 border border-blue-100 rounded-3xl p-8 hover:border-blue-400 transition-all duration-300 group shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-blue-700 mb-4">Health Tracking</h2>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Track your BMI, weight, nutrition progress, and manage your profile settings all in one place.
                </p>
                <button
                  onClick={() => router.push('/health-tracker')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25"
                >
                  Open Health Tracking Hub
                </button>
              </div>
              <div className="bg-white/90 border border-purple-100 rounded-3xl p-8 hover:border-purple-400 transition-all duration-300 group shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">💬</span>
                </div>
                <h2 className="text-2xl font-bold text-purple-700 mb-4">Community</h2>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Connect with fellow health enthusiasts, join challenges, share recipes, and stay motivated together.
                </p>
                <button
                  onClick={() => router.push('/community')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25"
                >
                  Join Community
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-12 bg-white/90 border border-emerald-100 rounded-3xl p-8 shadow animate-fade-in-up">
              <h2 className="text-2xl font-bold text-emerald-700 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-emerald-50 rounded-2xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-emerald-700 font-medium">Completed meal plan for today</p>
                    <p className="text-gray-500 text-sm">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-2xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">📊</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-700 font-medium">Updated health metrics</p>
                    <p className="text-gray-500 text-sm">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-2xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">🛒</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-purple-700 font-medium">Generated grocery list</p>
                    <p className="text-gray-500 text-sm">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ Quick Calorie Checker Widget */}
            <div className="mt-12 bg-white/90 border border-green-100 rounded-3xl p-8 shadow animate-fade-in-up">
              <QuickCalorieChecker />
            </div>

          </div>
        </div>
      </FitFeastLayout>
    </ProtectedRoute>
  );
}
