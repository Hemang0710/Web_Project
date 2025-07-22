'use client';

import { useState } from 'react';

interface HealthRecordFormProps {
  onSubmit: (data: {
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
  }) => void;
}

export default function HealthRecordForm({ onSubmit }: HealthRecordFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    nutrition: {
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
    },
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate BMI
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height) / 100; // Convert cm to m
    const bmi = weight / (height * height);

    onSubmit({
      date: formData.date,
      weight: weight,
      height: parseFloat(formData.height),
      bmi: parseFloat(bmi.toFixed(1)),
      nutrition: {
        calories: parseFloat(formData.nutrition.calories),
        protein: parseFloat(formData.nutrition.protein),
        carbs: parseFloat(formData.nutrition.carbs),
        fats: parseFloat(formData.nutrition.fats),
      },
      notes: formData.notes,
    });

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      height: '',
      nutrition: {
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
      },
      notes: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('nutrition.')) {
      const nutritionField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        nutrition: {
          ...prev.nutrition,
          [nutritionField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-black mb-2">
          Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-black mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            required
            min="0"
            step="0.1"
            className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300"
            placeholder="70.5"
          />
        </div>

        <div>
          <label htmlFor="height" className="block text-sm font-medium text-black mb-2">
            Height (cm)
          </label>
          <input
            type="number"
            id="height"
            name="height"
            value={formData.height}
            onChange={handleChange}
            required
            min="0"
            step="0.1"
            className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300"
            placeholder="175"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-black flex items-center">
          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
          Nutrition
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nutrition.calories" className="block text-sm font-medium text-black mb-2">
              Calories
            </label>
            <input
              type="number"
              id="nutrition.calories"
              name="nutrition.calories"
              value={formData.nutrition.calories}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300"
              placeholder="2000"
            />
          </div>

          <div>
            <label htmlFor="nutrition.protein" className="block text-sm font-medium text-black mb-2">
              Protein (g)
            </label>
            <input
              type="number"
              id="nutrition.protein"
              name="nutrition.protein"
              value={formData.nutrition.protein}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300"
              placeholder="150"
            />
          </div>

          <div>
            <label htmlFor="nutrition.carbs" className="block text-sm font-medium text-black mb-2">
              Carbs (g)
            </label>
            <input
              type="number"
              id="nutrition.carbs"
              name="nutrition.carbs"
              value={formData.nutrition.carbs}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300"
              placeholder="250"
            />
          </div>

          <div>
            <label htmlFor="nutrition.fats" className="block text-sm font-medium text-black mb-2">
              Fats (g)
            </label>
            <input
              type="number"
              id="nutrition.fats"
              name="nutrition.fats"
              value={formData.nutrition.fats}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300"
              placeholder="65"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-black mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300"
          placeholder="Any additional notes about your health record..."
        />
      </div>

      <button
        type="submit"
        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
      >
        <span className="flex items-center justify-center">
          <span className="mr-2">💾</span>
          Save Record
        </span>
      </button>
    </form>
  );
} 