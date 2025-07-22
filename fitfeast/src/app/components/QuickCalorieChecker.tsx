"use client";

import { useState } from "react";

// Add a type for the nutrition result
interface NutritionResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  error?: string;
}

export default function QuickCalorieChecker() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<NutritionResult | { error: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const searchFood = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

    const res = await fetch(`/api/nutrition?query=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setResult(data);
    } else {
      setResult({ error: "Food not found" });
    }
    setLoading(false);
  };

  const calcBurnTime = (calories: number) => {
    const walkingRate = 3.8; // kcal/min for 140 lbs
    const runningRate = 10;
    const cyclingRate = 7.5;

    return {
      walking: Math.ceil(calories / walkingRate),
      running: Math.ceil(calories / runningRate),
      cycling: Math.ceil(calories / cyclingRate),
    };
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-emerald-700 mb-4">🥗 Quick Calorie Checker</h2>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="e.g. 1 banana"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={searchFood}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:scale-105 transition"
        >
          Search
        </button>
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-500">Checking...</p>}

      {/* Result */}
      {result && 'food_name' in result && !('error' in result) && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <h3 className="text-xl font-semibold text-emerald-700 capitalize">{result.food_name}</h3>
          <p>Calories: <span className="font-bold">{result.calories}</span> kcal</p>
          <p>Protein: {result.protein} g | Carbs: {result.carbs} g | Fat: {result.fat} g</p>

          {/* Burn Time */}
          <div className="mt-4">
            <h4 className="font-semibold text-emerald-600">🔥 Burn it off:</h4>
            {(() => {
              const burn = calcBurnTime(result.calories);
              return (
                <ul className="mt-2 space-y-1 text-gray-700">
                  <li>🚶 Walking (3 mph): {burn.walking} min</li>
                  <li>🏃 Running (6 mph): {burn.running} min</li>
                  <li>🚴 Cycling (10 mph): {burn.cycling} min</li>
                </ul>
              );
            })()}
          </div>
        </div>
      )}

      {/* Error */}
      {result && 'error' in result && (
        <p className="text-red-500 mt-2">{result.error}</p>
      )}
    </div>
  );
}
