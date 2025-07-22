"use client";

import { useEffect, useState } from 'react';

interface MealPlan {
  _id: string;
  title: string;
  description?: string;
  totalCost: number;
  totalCalories: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCompleted?: boolean;
}

export default function MealPlansManager() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/savedmealplans', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch meal plans');
      const data = await res.json();
      setMealPlans(Array.isArray(data) ? data : data.mealPlans || []);
    } catch (err: any) {
      setError(err.message || 'Error loading meal plans');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this meal plan?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/savedmealplans/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete meal plan');
      setMealPlans(plans => plans.filter(p => p._id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting meal plan');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (id: string) => {
    try {
      const res = await fetch(`/api/savedmealplans/${id}/export?format=csv`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to export meal plan');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meal-plan-${id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Error exporting meal plan');
    }
  };

  const handleEdit = (plan: MealPlan) => {
    setEditingPlan(plan);
    setEditTitle(plan.title);
    setEditDescription(plan.description || '');
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editingPlan) return;
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`/api/savedmealplans/${editingPlan._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: editTitle, description: editDescription })
      });
      if (!res.ok) throw new Error('Failed to update meal plan');
      const updated = await res.json();
      setMealPlans(plans => plans.map(p => p._id === updated._id ? { ...p, ...updated } : p));
      setEditingPlan(null);
    } catch (err: any) {
      setEditError(err.message || 'Error updating meal plan');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditingPlan(null);
    setEditError('');
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      const res = await fetch(`/api/savedmealplans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: true })
      });
      if (!res.ok) throw new Error('Failed to mark meal plan as completed');
      const updated = await res.json();
      setMealPlans(plans => plans.map(p => p._id === updated._id ? { ...p, ...updated } : p));
      alert('Meal plan marked as completed! Dashboard stats will update.');
    } catch (err: any) {
      alert(err.message || 'Error marking meal plan as completed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-emerald-700">My Meal Plans</h1>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : mealPlans.length === 0 ? (
        <div className="text-gray-500">No meal plans found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mealPlans.map(plan => (
            <div key={plan._id} className="bg-white rounded-xl shadow p-6 border border-emerald-100 flex flex-col">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-emerald-800 mb-1">{plan.title}</h2>
                <p className="text-gray-500 text-sm mb-2">{plan.description}</p>
                <div className="flex flex-wrap gap-4 mb-2">
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">{plan.isActive ? 'Active' : 'Inactive'}</span>
                  <span className="text-xs text-gray-400">{new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-6 mb-2">
                  <div>
                    <div className="text-xs text-gray-400">Total Cost</div>
                    <div className="font-bold text-emerald-700">${plan.totalCost?.toFixed(2) ?? 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Total Calories</div>
                    <div className="font-bold text-emerald-700">{plan.totalCalories?.toLocaleString() ?? 'N/A'}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <a href={`/meal-plans/${plan._id}`} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium transition">View</a>
                <button onClick={() => handleExport(plan._id)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded text-sm font-medium transition">Export CSV</button>
                <button onClick={() => handleDelete(plan._id)} disabled={deletingId === plan._id} className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50">{deletingId === plan._id ? 'Deleting...' : 'Delete'}</button>
                <button onClick={() => handleEdit(plan)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded text-sm font-medium transition">Edit</button>
                {!plan.isCompleted && (
                  <button onClick={() => handleMarkCompleted(plan._id)} className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded text-sm font-medium transition">Mark as Completed</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full relative">
            <button onClick={handleEditCancel} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-xl font-bold mb-4 text-yellow-700">Edit Meal Plan</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="w-full border rounded px-3 py-2" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
            </div>
            {editError && <div className="text-red-600 mb-2">{editError}</div>}
            <div className="flex gap-3 justify-end">
              <button onClick={handleEditCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700">Cancel</button>
              <button onClick={handleEditSave} disabled={editLoading} className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-semibold disabled:opacity-50">{editLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 