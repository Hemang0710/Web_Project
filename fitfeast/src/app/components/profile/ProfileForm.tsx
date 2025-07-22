"use client";

import React, { useState, useEffect } from 'react';

interface ProfileFormState {
  weight: string;
  height: string;
  location: string;
  currency: string;
  budgetWeekly: string;
  minDailyBudget: string;
  maxDailyBudget: string;
  numberOfPeople: number;
  dietType: string;
  preferredMealTypes: string[];
  allergies: string;
  preferredCuisine: string[];
}

export default function ProfileForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<ProfileFormState>({
    weight: '',
    height: '',
    location: '',
    currency: 'USD',
    budgetWeekly: '',
    minDailyBudget: '',
    maxDailyBudget: '',
    numberOfPeople: 1,
    dietType: 'balanced',
    preferredMealTypes: ['breakfast', 'lunch', 'dinner'],
    allergies: '',
    preferredCuisine: [],
  });

  useEffect(() => {
    setLoading(true);
    fetch('/api/user/preferences')
      .then(res => res.json())
      .then(data => {
        if (data.preferences) {
          setForm(f => ({ ...f, ...data.preferences, allergies: (data.preferences.allergies || []).join(', ') }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Add options arrays for selects
  const currencyOptions: string[] = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN'];
  const dietTypeOptions: string[] = ['balanced', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'low-carb', 'high-protein', 'gluten-free', 'dairy-free'];
  const mealTypeOptions: string[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const steps = [
    {
      label: 'Physical Info',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block font-medium">Weight (kg)</label>
            <input type="number" min={30} max={300} className="input" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} required />
          </div>
          <div>
            <label className="block font-medium">Height (cm)</label>
            <input type="number" min={100} max={250} className="input" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} required />
          </div>
        </div>
      )
    },
    {
      label: 'Location & Budget',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block font-medium">Location</label>
            <input type="text" className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </div>
          <div>
            <label className="block font-medium">Currency</label>
            <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {currencyOptions.map((c: string) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-medium">Weekly Budget</label>
            <input type="number" min={10} max={10000} className="input" value={form.budgetWeekly} onChange={e => setForm(f => ({ ...f, budgetWeekly: e.target.value }))} required />
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block font-medium">Min Daily Budget</label>
              <input type="number" min={1} className="input" value={form.minDailyBudget} onChange={e => setForm(f => ({ ...f, minDailyBudget: e.target.value }))} required />
            </div>
            <div>
              <label className="block font-medium">Max Daily Budget</label>
              <input type="number" min={1} className="input" value={form.maxDailyBudget} onChange={e => setForm(f => ({ ...f, maxDailyBudget: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="block font-medium">Number of People</label>
            <input type="number" min={1} max={20} className="input" value={form.numberOfPeople} onChange={e => setForm(f => ({ ...f, numberOfPeople: Number(e.target.value) }))} required />
          </div>
        </div>
      )
    },
    {
      label: 'Diet & Preferences',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block font-medium">Diet Type</label>
            <select className="input" value={form.dietType} onChange={e => setForm(f => ({ ...f, dietType: e.target.value }))}>
              {dietTypeOptions.map((d: string) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-medium">Preferred Meal Types</label>
            <div className="flex gap-2 flex-wrap">
              {mealTypeOptions.map((type: string) => (
                <label key={type} className="flex items-center gap-1">
                  <input type="checkbox" checked={form.preferredMealTypes.includes(type)} onChange={e => {
                    setForm(f => ({
                      ...f,
                      preferredMealTypes: e.target.checked
                        ? [...f.preferredMealTypes, type]
                        : f.preferredMealTypes.filter(t => t !== type)
                    }));
                  }} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-medium">Allergies (comma separated)</label>
            <input type="text" className="input" value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="e.g. peanuts, shellfish" />
          </div>
        </div>
      )
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        allergies: form.allergies.split(',').map(a => a.trim()).filter(Boolean),
        preferredMealTypes: form.preferredMealTypes,
        weight: Number(form.weight),
        height: Number(form.height),
        budgetWeekly: Number(form.budgetWeekly),
        minDailyBudget: Number(form.minDailyBudget),
        maxDailyBudget: Number(form.maxDailyBudget),
        numberOfPeople: Number(form.numberOfPeople)
      };
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      setSuccess('Preferences saved!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 space-y-8" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-green-700 mb-2">Profile & Preferences</h2>
      <div className="flex items-center justify-between mb-4">
        {steps.map((s, i) => (
          <div key={i} className={`flex-1 h-2 mx-1 rounded ${i <= step ? 'bg-green-500' : 'bg-green-100'}`}></div>
        ))}
      </div>
      <div>{steps[step].content}</div>
      {error && <div className="text-red-600 font-medium">{error}</div>}
      {success && <div className="text-green-600 font-medium">{success}</div>}
      <div className="flex justify-between mt-8 gap-4">
        <button
          type="button"
          className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 shadow"
          disabled={step === 0}
          onClick={() => setStep(s => Math.max(0, s - 1))}
        >
          ← Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 flex items-center gap-2"
            onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
          >
            Next <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button
            type="submit"
            className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        )}
      </div>
    </form>
  );
}

// Tailwind utility classes for inputs and buttons
// .input: px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400
// .btn: px-4 py-2 rounded font-semibold shadow hover:shadow-md transition 