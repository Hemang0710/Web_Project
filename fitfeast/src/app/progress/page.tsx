'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FitFeastLayout from '../components/layout/FitFeastLayout';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../components/ProtectedRoute';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface HealthRecord {
  // Define the structure as needed
  [key: string]: unknown;
}

// Nutrition interface for type safety
interface Nutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fat?: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!session?.user) return;
      try {
        const response = await fetch('/api/health-records', {
          headers: {
            'user-data': JSON.stringify({ email: session.user.email })
          }
        });
        if (!response.ok) throw new Error('Failed to fetch records');
        const data = await response.json();
        setRecords(Array.isArray(data) ? data : (data.records || []));
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [session?.user]);

  useEffect(() => {
    // Fetch user profile for height/weight
    const fetchProfile = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch('/api/user/preferences');
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data.preferences);
        }
      } catch {}
    };
    fetchProfile();
  }, [session?.user]);

  const refreshRecords = async () => {
    setRefreshing(true);
    try {
      if (!session?.user) return;
      const response = await fetch('/api/health-records', {
        headers: {
          'user-data': JSON.stringify({ email: session.user.email })
        }
      });
      if (!response.ok) throw new Error('Failed to fetch records');
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : (data.records || []));
    } catch (error) {
      console.error('Error refreshing records:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Chart.js data for calories and weight
  const chartData = {
    labels: records.map(r => (typeof r.date === 'string' || typeof r.date === 'number' || r.date instanceof Date) ? new Date(r.date).toLocaleDateString() : ''),
    datasets: [
      {
        label: 'Calories',
        data: records.map(r => (typeof r.nutrition === 'object' && r.nutrition !== null && 'calories' in r.nutrition && typeof (r.nutrition as Nutrition).calories === 'number') ? (r.nutrition as Nutrition).calories : 0),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Weight (kg)',
        data: records.map(r => (typeof r.weight === 'number' ? r.weight : 0)),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        yAxisID: 'y1',
      }
    ]
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Calories & Weight Progress' }
    },
    scales: {
      y: { type: 'linear' as const, display: true, position: 'left' as const },
      y1: { type: 'linear' as const, display: true, position: 'right' as const, grid: { drawOnChartArea: false } }
    }
  };

  // Macro breakdown chart data
  const macroData = {
    labels: records.map(r => (typeof r.date === 'string' || typeof r.date === 'number' || r.date instanceof Date) ? new Date(r.date).toLocaleDateString() : ''),
    datasets: [
      {
        label: 'Protein (g)',
        data: records.map(r => (typeof r.nutrition === 'object' && r.nutrition !== null && 'protein' in r.nutrition && typeof (r.nutrition as Nutrition).protein === 'number') ? (r.nutrition as Nutrition).protein : 0),
        backgroundColor: 'rgba(34,197,94,0.6)',
      },
      {
        label: 'Carbs (g)',
        data: records.map(r => (typeof r.nutrition === 'object' && r.nutrition !== null && 'carbs' in r.nutrition && typeof (r.nutrition as Nutrition).carbs === 'number') ? (r.nutrition as Nutrition).carbs : 0),
        backgroundColor: 'rgba(59,130,246,0.6)',
      },
      {
        label: 'Fats (g)',
        data: records.map(r => (typeof r.nutrition === 'object' && r.nutrition !== null && (('fats' in r.nutrition && typeof (r.nutrition as Nutrition).fats === 'number') || ('fat' in r.nutrition && typeof (r.nutrition as Nutrition).fat === 'number'))) ? ((r.nutrition as Nutrition).fats ?? (r.nutrition as Nutrition).fat) : 0),
        backgroundColor: 'rgba(245,158,11,0.6)',
      },
    ]
  };
  const macroOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Macros Breakdown' }
    },
    scales: { y: { beginAtZero: true } }
  };

  // Streaks and weekly averages
  let streak = 0, maxStreak = 0, lastGoalMet = false;
  let calorieGoal = 0, proteinGoal = 0;
  let weekCalories: number[] = [], weekProtein: number[] = [], weekCarbs: number[] = [], weekFats: number[] = [];
  if (userProfile && records.length > 0) {
    const lastRecord = records[records.length - 1];
    const weight = typeof lastRecord.weight === 'number' ? lastRecord.weight : 0;
    const height = typeof lastRecord.height === 'number' ? lastRecord.height : 0;
    calorieGoal = Math.round(10 * weight + 6.25 * height - 5 * 30 + 5) * 1.55;
    proteinGoal = weight;
    let currentStreak = 0;
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const met = (typeof r.nutrition === 'object' && r.nutrition !== null && 'calories' in r.nutrition && typeof (r.nutrition as Nutrition).calories === 'number' ? (r.nutrition as Nutrition).calories : 0) >= calorieGoal &&
        (typeof r.nutrition === 'object' && r.nutrition !== null && 'protein' in r.nutrition && typeof (r.nutrition as Nutrition).protein === 'number' ? (r.nutrition as Nutrition).protein : 0) >= proteinGoal;
      if (met) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }
    streak = currentStreak;
    // Weekly averages (last 7 days)
    const last7 = records.slice(-7);
    weekCalories = last7.map(r => (typeof r.nutrition === 'object' && r.nutrition !== null && 'calories' in r.nutrition && typeof (r.nutrition as Nutrition).calories === 'number' ? (r.nutrition as Nutrition).calories : 0)).filter((n): n is number => typeof n === 'number');
    weekProtein = last7.map(r => (typeof r.nutrition === 'object' && r.nutrition !== null && 'protein' in r.nutrition && typeof (r.nutrition as Nutrition).protein === 'number' ? (r.nutrition as Nutrition).protein : 0)).filter((n): n is number => typeof n === 'number');
    weekCarbs = last7.map(r => (typeof r.nutrition === 'object' && r.nutrition !== null && 'carbs' in r.nutrition && typeof (r.nutrition as Nutrition).carbs === 'number' ? (r.nutrition as Nutrition).carbs : 0)).filter((n): n is number => typeof n === 'number');
    weekFats = last7.map(r => (typeof r.nutrition === 'object' && r.nutrition !== null && (('fats' in r.nutrition && typeof (r.nutrition as Nutrition).fats === 'number') || ('fat' in r.nutrition && typeof (r.nutrition as Nutrition).fat === 'number')) ? ((r.nutrition as Nutrition).fats ?? (r.nutrition as Nutrition).fat) : 0)).filter((n): n is number => typeof n === 'number');
  }

  // More detailed suggestions
  let detailedSuggestion = '';
  if (userProfile && records.length > 0) {
    const latest = records[records.length - 1];
    const weight = typeof latest.weight === 'number' ? latest.weight : 0;
    const height = typeof latest.height === 'number' ? latest.height : 0;
    const avgCalories = Math.round(records.reduce((sum, r) => sum + (typeof r.nutrition === 'object' && r.nutrition !== null && 'calories' in r.nutrition && typeof (r.nutrition as Nutrition).calories === 'number' ? (r.nutrition as Nutrition).calories : 0), 0) / records.length);
    const avgProtein = Math.round(records.reduce((sum, r) => sum + (typeof r.nutrition === 'object' && r.nutrition !== null && 'protein' in r.nutrition && typeof (r.nutrition as Nutrition).protein === 'number' ? (r.nutrition as Nutrition).protein : 0), 0) / records.length);
    const tdee = Math.round(10 * weight + 6.25 * height - 5 * 30 + 5) * 1.55;
    if (avgCalories > tdee + 100) {
      detailedSuggestion = 'You are eating above your estimated needs. Consider reducing calories for weight loss.';
    } else if (avgCalories < tdee - 100) {
      detailedSuggestion = 'You are eating below your estimated needs. You may lose weight, but ensure you are not under-eating.';
    } else {
      detailedSuggestion = 'Your calorie intake is well-matched to your estimated needs. Maintain your current habits for stability.';
    }
    if (avgProtein < weight) {
      detailedSuggestion += ' Your average protein intake is below your body weight. Aim for at least 1g protein per kg.';
    }
    if (maxStreak >= 3) {
      detailedSuggestion += ` Great job! You had a streak of ${maxStreak} days meeting your goals.`;
    }
    // Highlight best/worst days
    const bestDay = records.length > 0 ? records.reduce((best, r) => ((typeof r.nutrition === 'object' && r.nutrition !== null && 'calories' in r.nutrition && typeof (r.nutrition as Nutrition).calories === 'number' ? (r.nutrition as Nutrition).calories : 0) > (typeof best.nutrition === 'object' && best.nutrition !== null && 'calories' in best.nutrition && typeof (best.nutrition as Nutrition).calories === 'number' ? (best.nutrition as Nutrition).calories : 0)) ? r : best, records[0]) : undefined;
    const worstDay = records.length > 0 ? records.reduce((worst, r) => ((typeof r.nutrition === 'object' && r.nutrition !== null && 'calories' in r.nutrition && typeof (r.nutrition as Nutrition).calories === 'number' ? (r.nutrition as Nutrition).calories : 0) < (typeof worst.nutrition === 'object' && worst.nutrition !== null && 'calories' in worst.nutrition && typeof (worst.nutrition as Nutrition).calories === 'number' ? (worst.nutrition as Nutrition).calories : 0)) ? r : worst, records[0]) : undefined;
    detailedSuggestion += ` Your best day was ${(typeof (bestDay?.date ?? '') === 'string' || typeof (bestDay?.date ?? '') === 'number' || (bestDay?.date ?? '') instanceof Date) ? new Date(bestDay?.date ?? '').toLocaleDateString() : 'N/A'} (${typeof (bestDay?.nutrition ?? {}) === 'object' && (bestDay?.nutrition ?? null) !== null && 'calories' in (bestDay?.nutrition ?? {}) && typeof ((bestDay?.nutrition ?? {}) as Nutrition).calories === 'number' ? ((bestDay?.nutrition ?? {}) as Nutrition).calories : 0} kcal), and your lowest was ${(typeof (worstDay?.date ?? '') === 'string' || typeof (worstDay?.date ?? '') === 'number' || (worstDay?.date ?? '') instanceof Date) ? new Date(worstDay?.date ?? '').toLocaleDateString() : 'N/A'} (${typeof (worstDay?.nutrition ?? {}) === 'object' && (worstDay?.nutrition ?? null) !== null && 'calories' in (worstDay?.nutrition ?? {}) && typeof ((worstDay?.nutrition ?? {}) as Nutrition).calories === 'number' ? ((worstDay?.nutrition ?? {}) as Nutrition).calories : 0} kcal).`;
  }

  // Pie chart for latest day's macros
  const latest = records.length > 0 ? records[records.length - 1] : undefined;
  const pieData = latest ? {
    labels: ['Protein', 'Carbs', 'Fats'],
    datasets: [
      {
        data: [
          typeof latest.nutrition === 'object' && latest.nutrition !== null && 'protein' in latest.nutrition && typeof (latest.nutrition as Nutrition).protein === 'number' ? (latest.nutrition as Nutrition).protein : 0,
          typeof latest.nutrition === 'object' && latest.nutrition !== null && 'carbs' in latest.nutrition && typeof (latest.nutrition as Nutrition).carbs === 'number' ? (latest.nutrition as Nutrition).carbs : 0,
          typeof latest.nutrition === 'object' && latest.nutrition !== null && (('fats' in latest.nutrition && typeof (latest.nutrition as Nutrition).fats === 'number') || ('fat' in latest.nutrition && typeof (latest.nutrition as Nutrition).fat === 'number')) ? ((latest.nutrition as Nutrition).fats ?? (latest.nutrition as Nutrition).fat) : 0
        ],
        backgroundColor: [
          'rgba(34,197,94,0.7)',
          'rgba(59,130,246,0.7)',
          'rgba(245,158,11,0.7)'
        ],
        borderWidth: 1,
      }
    ]
  } : null;
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const },
      title: { display: true, text: 'Latest Day Macro Breakdown' }
    }
  };

  return (
    <FitFeastLayout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-screen-2xl mx-auto py-10 px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-emerald-700 mb-2 tracking-tight animate-fade-in">Progress & Analytics</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in-up">Track your health journey with beautiful charts, weekly stats, and personalized insights.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-emerald-100 flex flex-col items-center">
              <h2 className="text-xl font-bold text-emerald-700 mb-4">Calories & Weight Progress</h2>
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-emerald-100 flex flex-col items-center">
              <h2 className="text-xl font-bold text-emerald-700 mb-4">Macros Breakdown</h2>
              <Bar data={macroData} options={macroOptions} />
            </div>
          </div>
          {pieData && (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-emerald-100 flex flex-col items-center mb-10 animate-fade-in-up">
              <h2 className="text-xl font-bold text-emerald-700 mb-4">Latest Day Macro Breakdown</h2>
              <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-emerald-100 animate-fade-in-up">
            <h2 className="text-xl font-bold text-emerald-700 mb-4">Weekly Averages & Streaks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-2">Calories (last 7 days): <span className="font-semibold text-emerald-700">{(weekCalories ?? []).join(', ')}</span></p>
                <p className="text-gray-600 mb-2">Protein (last 7 days): <span className="font-semibold text-emerald-700">{(weekProtein ?? []).join(', ')}</span></p>
                <p className="text-gray-600 mb-2">Carbs (last 7 days): <span className="font-semibold text-emerald-700">{(weekCarbs ?? []).join(', ')}</span></p>
                <p className="text-gray-600 mb-2">Fats (last 7 days): <span className="font-semibold text-emerald-700">{(weekFats ?? []).join(', ')}</span></p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Current Streak: <span className="font-semibold text-emerald-700">{streak} days</span></p>
                <p className="text-gray-600 mb-2">Max Streak: <span className="font-semibold text-emerald-700">{maxStreak} days</span></p>
                <p className="text-gray-600 mb-2">Calorie Goal: <span className="font-semibold text-emerald-700">{calorieGoal}</span></p>
                <p className="text-gray-600 mb-2">Protein Goal: <span className="font-semibold text-emerald-700">{proteinGoal}</span></p>
              </div>
            </div>
            {detailedSuggestion && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 animate-fade-in-up">
                <span className="font-semibold">Insight:</span> {detailedSuggestion}
              </div>
            )}
          </div>
          <div className="flex justify-end mt-8">
            <button
              onClick={refreshRecords}
              disabled={refreshing}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>
    </FitFeastLayout>
  );
} 