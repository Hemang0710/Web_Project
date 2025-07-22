'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import HealthRecordForm from './components/HealthRecordForm';
import HealthRecordList from './components/HealthRecordList';
import { useSession } from 'next-auth/react';
import FitFeastLayout from '../components/layout/FitFeastLayout';
import ProfileForm from '../components/profile/ProfileForm';
import { Bar } from 'react-chartjs-2';
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
  Legend
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
  Legend
);

interface HealthRecord {
  _id: string;
  date: string;
  weight: number;
  height: number;
  bmi: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    [key: string]: number;
  };
  notes: string;
  source: 'manual' | 'auto';
  [key: string]: unknown;
}

export default function HealthTracker() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('health-tracker');
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const tabs = [
    { id: 'health-tracker', name: 'Health Tracker', icon: '📊' },
    { id: 'progress', name: 'Progress Analytics', icon: '📈' },
    { id: 'profile', name: 'Profile Settings', icon: '👤' },
  ];

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/health-records', {
        headers: {
          'user-data': JSON.stringify({ email: session?.user?.email })
        }
      });
      if (!response.ok) throw new Error('Failed to fetch records');
      const data: { records: HealthRecord[] } | HealthRecord[] = await response.json();
      setRecords(Array.isArray(data) ? data : (data.records || []).map((r: HealthRecord) => ({ ...r, source: r.source || 'manual' })));
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (data: Omit<HealthRecord, '_id'>) => {
    try {
      const response = await fetch('/api/health-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-data': JSON.stringify({ email: session?.user?.email })
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add record');
      const newRecord: HealthRecord = await response.json();
      setRecords([ { ...newRecord, source: newRecord.source || 'manual' }, ...records ]);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const response = await fetch(`/api/health-records/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete record');
      setRecords(records.filter(record => record._id !== id));
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleUpdateRecord = async (id: string, data: Partial<HealthRecord>) => {
    try {
      const response = await fetch(`/api/health-records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-data': JSON.stringify({ email: session?.user?.email })
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update record');
      const updatedRecord: HealthRecord = await response.json();
      setRecords(records.map(record => 
        record._id === id ? updatedRecord : record
      ));
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  useEffect(() => {
    if (session?.user?.email) fetchRecords();
  }, [session?.user?.email]);

  useEffect(() => {
    // Fetch user profile for height/weight
    const fetchProfile = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch('/api/user/preferences');
        if (res.ok) {
          const data: { preferences: Record<string, unknown> } = await res.json();
          setUserProfile(data.preferences);
        }
      } catch {}
    };
    fetchProfile();
  }, [session?.user]);

  // Fetch AI suggestion based on recent records
  useEffect(() => {
    if (records.length === 0) return;
    const fetchSuggestion = async () => {
      const last7 = records.slice(-7);
      const nutritionSummary = last7.map(r => `Date: ${new Date(r.date).toLocaleDateString()}, Calories: ${r.nutrition.calories}, Protein: ${r.nutrition.protein}, Carbs: ${r.nutrition.carbs}, Fats: ${r.nutrition.fats}`).join('\n');
      const prompt = `Analyze my last 7 days of nutrition and give me 2-3 personalized suggestions for health improvement.\n${nutritionSummary}`;
      try {
        const res = await fetch('/api/ai/nutrition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        if (res.ok) {
          const data: { suggestion: string; result: string } = await res.json();
          setAiSuggestion(data.suggestion || data.result || '');
        }
      } catch {}
    };
    fetchSuggestion();
  }, [records]);

  // Modern analytics: Macro breakdown chart
  const macroData = {
    labels: records.map(r => new Date(r.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Protein (g)',
        data: records.map(r => r.nutrition?.protein || 0),
        backgroundColor: 'rgba(34,197,94,0.6)',
      },
      {
        label: 'Carbs (g)',
        data: records.map(r => r.nutrition?.carbs || 0),
        backgroundColor: 'rgba(59,130,246,0.6)',
      },
      {
        label: 'Fats (g)',
        data: records.map(r => r.nutrition?.fats || 0),
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'health-tracker':
        return (
          <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <div className="max-w-5xl mx-auto px-4 py-10">
              {/* Header Section */}
              <div className="text-center mb-10">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-emerald-700 mb-4 tracking-tight animate-fade-in">
                  Health <span className="text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text">Tracker</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up">
                  Monitor your BMI, weight, and nutrition progress with detailed analytics
                </p>
              </div>
              {error && (
                <div className="bg-red-100 border border-red-200 text-red-600 px-6 py-4 rounded-2xl mb-8">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mr-4">
                      <span className="text-2xl">➕</span>
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-700">Add New Record</h2>
                  </div>
                  <HealthRecordForm onSubmit={handleAddRecord} />
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mr-4">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h2 className="text-2xl font-bold text-blue-700">Your Records</h2>
                  </div>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading records...</p>
                    </div>
                  ) : (
                    <HealthRecordList
                      records={records}
                      onDelete={handleDeleteRecord}
                      onUpdate={handleUpdateRecord}
                    />
                  )}
                </div>
              </div>
              {/* Modern analytics and AI suggestion */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
                  <h3 className="text-xl font-semibold mb-4 text-emerald-700">Macros Breakdown (Last 30 Days)</h3>
                  <Bar data={macroData} options={macroOptions} />
                </div>
                <div className="bg-emerald-50 rounded-2xl shadow-lg border border-emerald-100 p-8 flex flex-col justify-between">
                  <h3 className="text-xl font-semibold mb-4 text-emerald-700">AI Health Suggestions</h3>
                  {aiSuggestion ? (
                    <div className="text-emerald-700 text-lg whitespace-pre-line">{aiSuggestion}</div>
                  ) : (
                    <div className="text-gray-500">Loading personalized suggestions...</div>
                  )}
                </div>
              </div>
              {/* Export button */}
              <div className="mt-8 flex justify-end">
                <button
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-500/25"
                  onClick={() => {
                    const csv = [
                      'Date,Weight,Height,BMI,Calories,Protein,Carbs,Fats,Notes',
                      ...records.map(r => `${new Date(r.date).toLocaleDateString()},${r.weight},${r.height},${r.bmi},${r.nutrition.calories},${r.nutrition.protein},${r.nutrition.carbs},${r.nutrition.fats},"${r.notes?.replace(/"/g, '""') || ''}"`)
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'health-records.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  Export Health Data (CSV)
                </button>
              </div>
            </div>
          </div>
        );
      case 'progress':
        return (
          <div className="max-w-5xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6 text-emerald-700">Progress Analytics</h1>
            <p className="text-gray-600 mb-8">Track your health journey with detailed analytics and progress visualization.</p>
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <div className="text-6xl mb-4">📈</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Progress Tracking</h2>
              <p className="text-gray-600 mb-6">View detailed progress charts, BMI trends, and nutrition analytics.</p>
              <a 
                href="/progress" 
                className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
              >
                View Progress Dashboard
              </a>
            </div>
          </div>
        );
      case 'profile':
        return <ProfileForm />;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <FitFeastLayout>
        <div className="max-w-screen-2xl mx-auto py-8 px-4 sm:px-8 lg:px-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-emerald-700 mb-2">Health & Wellness Hub</h1>
            <p className="text-gray-600">Track your health, monitor progress, and manage your profile</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {renderTabContent()}
          </div>
        </div>
      </FitFeastLayout>
    </ProtectedRoute>
  );
} 