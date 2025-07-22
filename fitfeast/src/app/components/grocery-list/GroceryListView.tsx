"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export default function GroceryListView() {
  const [selectedMeals, setSelectedMeals] = useState<Record<string, unknown>[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const router = useRouter();

  // Local price data (fallback)
  const localPrices: Record<string, number> = {
    "chicken breast": 3.5,
    "rice": 1.0,
    "broccoli": 0.9,
    "tomato": 0.8,
    "onion": 0.6,
    "potato": 0.5,
    "black beans": 1.4,
    "lentils": 1.1,
    "bread": 2.5,
    "milk": 1.6,
    "eggs": 2.1,
    "cheese": 4.0,
    "butter": 3.0,
    "olive oil": 8.0,
    "salt": 0.5,
    "black pepper": 2.0,
    "flour": 1.0,
    "sugar": 0.8,
    "garlic": 0.1,
    "bell pepper": 1.0,
    "carrot": 0.4,
    "spinach": 2.0,
    "lettuce": 1.5,
    "yogurt": 1.0,
    "ground beef": 4.5,
    "salmon": 8.0,
    "shrimp": 6.0,
    "pasta": 1.5,
    "cumin": 3.0,
    "turmeric": 2.5,
    "oregano": 2.0,
    "basil": 2.5,
    "tomato sauce": 1.0,
    "beans": 0.8,
    "tuna": 1.5,
    "orange juice": 4.0,
    "coffee": 8.0,
    "tea": 3.0
  };

  // Aggregate and deduplicate ingredients
  useEffect(() => {
    // Get selected meals from localStorage
    const stored = localStorage.getItem('selectedMeals');
    let meals: Record<string, unknown>[] = [];
    if (stored) {
      try {
        meals = JSON.parse(stored);
        setSelectedMeals(meals);
      } catch (e) {
        console.error('Error parsing selected meals:', e);
      }
    }
    if (meals.length === 0) return;
    setLoading(true);
    // Aggregate ingredients
    const ingredientMap: Record<string, GroceryItem> = {};
    meals.forEach(meal => {
      if (Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach((ing: unknown) => {
          const ingredient = ing as { name?: string; quantity?: number; unit?: string };
          const name = typeof ingredient.name === 'string' ? ingredient.name.toLowerCase() : '';
          if (!name) return;
          if (!ingredientMap[name]) {
            ingredientMap[name] = {
              name,
              quantity: typeof ingredient.quantity === 'number' ? ingredient.quantity : 1,
              unit: typeof ingredient.unit === 'string' ? ingredient.unit : '',
              price: localPrices[name] || 2.0
            };
          } else {
            ingredientMap[name].quantity += typeof ingredient.quantity === 'number' ? ingredient.quantity : 1;
          }
        });
      }
    });
    const list = Object.values(ingredientMap);
    setGroceryList(list);
    setTotalCost(list.reduce((sum: number, ing: GroceryItem) => sum + (ing.price || 0), 0));
    setLoading(false);
  }, []);

  // Delete ingredient
  const handleDelete = async (name: string) => {
    // If working with a saved grocery list, call backend
    if (groceryList.length && typeof (groceryList[0] as any)._id === 'string') {
      // Assume groceryListId is available (e.g., from props or state)
      const groceryListId = (groceryList[0] as any).groceryListId || (groceryList[0] as any)._id;
      try {
        const res = await fetch('/api/grocery-list', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groceryListId, itemName: name })
        });
        if (!res.ok) throw new Error('Failed to delete item');
        const updatedList = await res.json();
        setGroceryList(updatedList.items);
        setTotalCost(updatedList.totalEstimatedCost || 0);
      } catch (err) {
        alert('Error deleting item');
      }
    } else {
      // Local mode: update state and recalculate total
      setGroceryList(list => {
        const newList = list.filter(ing => ing.name !== name);
        setTotalCost(newList.reduce((sum: number, ing: GroceryItem) => sum + (ing.price || 0), 0));
        return newList;
      });
    }
  };

  // Export grocery list as CSV
  const handleExportCSV = () => {
    if (!groceryList.length) return;
    const header = ['Ingredient', 'Quantity', 'Unit', 'Price ($)'];
    const rows = groceryList.map(ing => [ing.name, ing.quantity, ing.unit, ing.price.toFixed(2)]);
    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery-list.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGoToMealSuggestions = () => {
    // Trigger event to switch back to meal suggestions tab
    const event = new CustomEvent('switchToMealSuggestions');
    window.dispatchEvent(event);
  };

  // Save meal plan to MongoDB
  const handleSaveMealPlan = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      // Calculate totalCalories from selectedMeals if not provided
      let totalCalories = 0;
      selectedMeals.forEach(meal => {
        if (typeof (meal as Record<string, unknown>).nutrition === 'object' && (meal as Record<string, unknown>).nutrition !== null && typeof ((meal as Record<string, unknown>).nutrition as Record<string, unknown>).calories === 'number') {
          totalCalories += ((meal as Record<string, unknown>).nutrition as Record<string, unknown>).calories as number;
        } else if (typeof (meal as Record<string, unknown>).calories === 'number') {
          totalCalories += (meal as Record<string, unknown>).calories as number;
        }
      });
      // Prompt for title/description (optional: can be replaced with UI fields)
      const title = window.prompt('Enter a title for your meal plan:', 'My Custom Meal Plan') || 'My Custom Meal Plan';
      const description = window.prompt('Enter a description (optional):', 'A meal plan generated from selected recipes.') || '';
      const budget = totalCost;
      const location = 'Home';
      const dietType = ['balanced'];
      const res = await fetch('/api/savedmealplans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          budget,
          location,
          dietType,
          selectedMeals,
          groceryList,
          totalCost,
          totalCalories,
          source: 'local' // or 'ai' if using AI
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save meal plan');
      }
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err.message || 'Error saving meal plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-emerald-700">Grocery List</h1>
      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-lg font-semibold">Total Estimated Cost: <span className="text-emerald-700">${totalCost.toFixed(2)}</span></div>
        {/* Export and Save buttons */}
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleExportCSV}>Export as CSV</button>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded" onClick={handleSaveMealPlan} disabled={saving}>{saving ? 'Saving...' : 'Save Meal Plan'}</button>
        </div>
      </div>
      {saveSuccess && <div className="mb-4 text-green-700 font-semibold">Meal plan saved successfully!</div>}
      {saveError && <div className="mb-4 text-red-600 font-semibold">{saveError}</div>}
      <div className="bg-white rounded-xl shadow p-4 border border-emerald-100">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2">Ingredient</th>
              <th className="text-left py-2">Quantity</th>
              <th className="text-left py-2">Unit</th>
              <th className="text-left py-2">Price ($)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {groceryList.map((ing: GroceryItem, idx: number) => (
              <tr key={idx} className="border-b">
                <td className="py-2 font-medium">{ing.name}</td>
                <td className="py-2">{ing.quantity}</td>
                <td className="py-2">{ing.unit}</td>
                <td className="py-2">{ing.price.toFixed(2)}</td>
                <td className="py-2">
                  <button className="text-red-500 hover:underline" onClick={() => handleDelete(ing.name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
    </div>
  );
}

// Tailwind utility classes for .btn are as before. 