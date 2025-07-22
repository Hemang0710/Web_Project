'use client';

import { useState } from 'react';

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
  };
  notes: string;
  source: 'manual' | 'auto'; // Added source field
}

interface EditFormData {
  date: string;
  weight: number;
  height: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  notes: string;
}

interface HealthRecordListProps {
  records: HealthRecord[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<HealthRecord>) => void;
}

export default function HealthRecordList({ records, onDelete, onUpdate }: HealthRecordListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);

  const handleEdit = (record: HealthRecord) => {
    setEditingId(record._id);
    setEditForm({
      date: record.date,
      weight: record.weight,
      height: record.height,
      nutrition: { ...record.nutrition },
      notes: record.notes,
    });
  };

  const handleSave = (id: string) => {
    if (editForm) {
      onUpdate(id, editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!editForm) return;

    if (name.startsWith('nutrition.')) {
      const nutritionField = name.split('.')[1];
      setEditForm({
        ...editForm,
        nutrition: {
          ...editForm.nutrition,
          [nutritionField]: parseFloat(value),
        },
      });
    } else {
      setEditForm({
        ...editForm,
        [name]: name === 'date' ? value : parseFloat(value),
      });
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">📊</span>
        </div>
        <p className="text-gray-400 text-lg">No records found. Add your first record above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map(record => (
        <div key={record._id} className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 hover:border-emerald-500/50 transition-all duration-300">
          <div className="flex justify-between items-center mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${record.source === 'auto' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
              {record.source === 'auto' ? <span className="mr-1">⚡</span> : <span className="mr-1">✏️</span>}
              {record.source === 'auto' ? 'Auto' : 'Manual'}
            </span>
            {editingId === record._id && editForm ? (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border-2 border-slate-600/50 text-gray-400 rounded-2xl font-semibold hover:bg-slate-700/50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(record._id)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(record)}
                  className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(record._id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {editingId === record._id && editForm ? (
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={editForm.weight}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={editForm.height}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Calories</label>
                  <input
                    type="number"
                    name="nutrition.calories"
                    value={editForm.nutrition.calories}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Protein (g)</label>
                  <input
                    type="number"
                    name="nutrition.protein"
                    value={editForm.nutrition.protein}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Carbs (g)</label>
                  <input
                    type="number"
                    name="nutrition.carbs"
                    value={editForm.nutrition.carbs}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Fats (g)</label>
                  <input
                    type="number"
                    name="nutrition.fats"
                    value={editForm.nutrition.fats}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={editForm.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border-2 border-slate-600/50 text-gray-400 rounded-2xl font-semibold hover:bg-slate-700/50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(record._id)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-black">{record.weight}</p>
                  <p className="text-xs text-gray-400">Weight (kg)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-black">{record.height}</p>
                  <p className="text-xs text-gray-400">Height (cm)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-black">{record.nutrition.calories}</p>
                  <p className="text-xs text-gray-400">Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-black">{record.nutrition.protein}g</p>
                  <p className="text-xs text-gray-400">Protein</p>
                </div>
              </div>

              {record.notes && (
                <div className="mt-4 p-3 bg-slate-800/50 rounded-2xl">
                  <p className="text-sm text-gray-300">{record.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 