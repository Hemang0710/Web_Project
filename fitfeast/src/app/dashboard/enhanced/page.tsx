'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FitFeastLayout from '../../components/layout/FitFeastLayout';

interface UserPreferences {
  currency: string;
  location: string;
  budgetWeekly: number;
  preferredCuisine: string[];
  dietType: string;
  height?: number;
  weight?: number;
}

interface MealPlan {
  // Define as needed
  [key: string]: unknown;
}

interface GroceryList {
  // Define as needed
  [key: string]: unknown;
}

interface ProgressStats {
  // Define as needed
  [key: string]: unknown;
}

export default function EnhancedDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/signin');
      return;
    }

    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [prefsRes, mealPlansRes, groceryRes, progressRes] = await Promise.all([
        fetch('/api/user/preferences'),
        fetch('/api/meal-plan/enhanced'),
        fetch('/api/grocery-list/enhanced?active=true'),
        fetch('/api/progress/enhanced?stats=true')
      ]);

      if (prefsRes.ok) {
        const prefsData = await prefsRes.json();
        setPreferences(prefsData.preferences);
      }

      if (mealPlansRes.ok) {
        const mealPlansData = await mealPlansRes.json();
        setMealPlans(mealPlansData.mealPlans || []);
      }

      if (groceryRes.ok) {
        const groceryData = await groceryRes.json();
        setGroceryLists(groceryData.groceryLists || []);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgressStats(progressData.stats);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshMealPlan = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/weekly-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        await fetchDashboardData();
        alert('Meal plan refreshed successfully!');
      } else {
        const error = await response.json();
        alert(`Error refreshing meal plan: ${error.error}`);
      }
    } catch (error) {
      console.error('Error refreshing meal plan:', error);
      alert('Failed to refresh meal plan');
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getWeightTrendColor = (trend: string) => {
    switch (trend) {
      case 'decreasing': return 'text-green-600';
      case 'increasing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getWeightTrendIcon = (trend: string) => {
    switch (trend) {
      case 'decreasing': return '↘️';
      case 'increasing': return '↗️';
      default: return '→';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <FitFeastLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your FitFeast dashboard...</p>
          </div>
        </div>
      </FitFeastLayout>
    );
  }

  return (
    <FitFeastLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">FitFeast Dashboard</h1>
                <p className="text-gray-600">Welcome back, {session?.user?.name}!</p>
              </div>
              <button
                onClick={handleRefreshMealPlan}
                disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh Meal Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Preferences Card */}
          {preferences && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p className="font-medium">{preferences.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{preferences.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weekly Budget</p>
                  <p className="font-medium">{formatCurrency(preferences.budgetWeekly, preferences.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Diet Type</p>
                  <p className="font-medium capitalize">{preferences.dietType}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Preferred Cuisines</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {preferences.preferredCuisine.map((cuisine, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
              <Link 
                href="/user/preferences" 
                className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit Preferences →
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Meal Plan */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Active Meal Plan</h2>
                <Link href="/meal-plans" className="text-blue-600 hover:text-blue-700 text-sm">
                  View All →
                </Link>
              </div>
              
              {mealPlans.length > 0 ? (
                <div>
                  {mealPlans.filter(plan => plan.isActive).map(plan => (
                    <div key={typeof plan._id === 'string' || typeof plan._id === 'number' ? plan._id : String(plan._id)} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{typeof plan.title === 'string' ? plan.title : ''}</h3>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-500">Total Cost</p>
                          <p className="font-medium">{formatCurrency(typeof plan.totalCost === 'number' ? plan.totalCost : 0, typeof preferences?.currency === 'string' ? preferences.currency : 'USD')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Calories</p>
                          <p className="font-medium">{typeof plan.totalCalories === 'number' ? plan.totalCalories.toLocaleString() : ''}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">
                          {plan.startDate && (typeof plan.startDate === 'string' || typeof plan.startDate === 'number' || plan.startDate instanceof Date)
                            ? new Date(plan.startDate).toLocaleDateString() : ''}
                          {' - '}
                          {plan.endDate && (typeof plan.endDate === 'string' || typeof plan.endDate === 'number' || plan.endDate instanceof Date)
                            ? new Date(plan.endDate).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <Link 
                        href={`/meal-plans/${typeof plan._id === 'string' ? plan._id : ''}`}
                        className="inline-block mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No active meal plan</p>
                  <Link 
                    href="/meal-plans"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Create Meal Plan
                  </Link>
                </div>
              )}
            </div>

            {/* Active Grocery List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Active Grocery List</h2>
                <Link href="/grocery-list" className="text-blue-600 hover:text-blue-700 text-sm">
                  View All →
                </Link>
              </div>
              
              {groceryLists.length > 0 ? (
                <div>
                  {groceryLists.filter(list => !list.isCompleted).map(list => (
                    <div key={typeof list._id === 'string' || typeof list._id === 'number' ? list._id : String(list._id)} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{typeof list.title === 'string' ? list.title : ''}</h3>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-500">Estimated Cost</p>
                          <p className="font-medium">{formatCurrency(typeof list.totalEstimatedCost === 'number' ? list.totalEstimatedCost : 0, typeof preferences?.currency === 'string' ? preferences.currency : 'USD')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Items</p>
                          <p className="font-medium">{Array.isArray(list.items) ? list.items.length : 0}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">
                          {Array.isArray(list.items) ? list.items.filter((item: any) => item.isPurchased).length : 0} of {Array.isArray(list.items) ? list.items.length : 0} items purchased
                        </p>
                      </div>
                      <Link 
                        href={`/grocery-list/${typeof list._id === 'string' ? list._id : ''}`}
                        className="inline-block mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No active grocery list</p>
                  <Link 
                    href="/grocery-list"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Create Grocery List
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Progress Tracking */}
          {progressStats && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Progress Tracking</h2>
                <Link href="/progress" className="text-blue-600 hover:text-blue-700 text-sm">
                  View Details →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Current Weight</p>
                  <p className="text-2xl font-bold text-gray-900">{typeof progressStats.currentWeight === 'number' ? progressStats.currentWeight : ''}</p>
                  <p className={`text-sm ${getWeightTrendColor(typeof progressStats.weightTrend === 'string' ? progressStats.weightTrend : '')}`}>
                    {getWeightTrendIcon(typeof progressStats.weightTrend === 'string' ? progressStats.weightTrend : '')} {typeof progressStats.weightChange === 'number' ? Math.abs(progressStats.weightChange) : ''} kg
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">Current BMI</p>
                  <p className="text-2xl font-bold text-gray-900">{typeof progressStats.currentBMI === 'number' ? progressStats.currentBMI : ''}</p>
                  <p className={`text-sm ${getWeightTrendColor(typeof progressStats.weightTrend === 'string' ? progressStats.weightTrend : '')}`}>
                    {typeof progressStats.bmiChange === 'number' && progressStats.bmiChange > 0 ? '+' : ''}{typeof progressStats.bmiChange === 'number' ? progressStats.bmiChange.toFixed(1) : ''}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">Avg. Daily Calories</p>
                  <p className="text-2xl font-bold text-gray-900">{typeof progressStats.averageCalories === 'number' ? progressStats.averageCalories : ''}</p>
                  <p className="text-sm text-gray-500">kcal</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">Days Tracked</p>
                  <p className="text-2xl font-bold text-gray-900">{typeof progressStats.totalDaysTracked === 'number' ? progressStats.totalDaysTracked : ''}</p>
                  <p className="text-sm text-gray-500">days</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href="/meal-plans"
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">🥗</span>
                <div>
                  <p className="font-medium text-gray-900">Create Meal Plan</p>
                  <p className="text-sm text-gray-500">Generate a new weekly meal plan</p>
                </div>
              </Link>
              
              <Link 
                href="/grocery-list"
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">🛒</span>
                <div>
                  <p className="font-medium text-gray-900">Grocery List</p>
                  <p className="text-sm text-gray-500">Create shopping list from meal plan</p>
                </div>
              </Link>
              
              <Link 
                href="/progress"
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <p className="font-medium text-gray-900">Track Progress</p>
                  <p className="text-sm text-gray-500">Log meals and weight</p>
                </div>
              </Link>
              
              <Link 
                href="/user/preferences"
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">⚙️</span>
                <div>
                  <p className="font-medium text-gray-900">Preferences</p>
                  <p className="text-sm text-gray-500">Update settings and preferences</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </FitFeastLayout>
  );
} 