"use client";

import React, { useEffect, useState } from 'react';

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  name: string;
  description?: string;
  ingredients: string[];
  instructions: string[] | string;
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

export default function MealSuggestionGrid() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);
  const [preferences, setPreferences] = useState({
    cuisine: '',
    dietary: '',
    minDailyBudget: '',
    maxDailyBudget: '',
    numberOfPeople: '',
    availableTime: '',
    // Optional fields
    cookingSkill: '',
    favoriteIngredients: '',
    healthGoals: '',
    seasonalPreferences: '',
    occasion: '',
  });
  const [mode, setMode] = useState<'meals' | 'weekly-plan'>('weekly-plan');
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, unknown> | null>(null);
  const [useAI, setUseAI] = useState(true); // Toggle for AI vs local JSON

  // Local mode filters
  const [localFilters, setLocalFilters] = useState({
    cuisine: '',
    dietary: '',
    difficulty: '',
    search: ''
  });

  const fetchLocalRecipes = async () => {
    setLoading(true);
    setError('');
    setMeals([]);
    setWeeklyPlan(null);
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (localFilters.cuisine) params.append('cuisine', localFilters.cuisine);
      if (localFilters.dietary) params.append('dietType', localFilters.dietary);
      if (localFilters.difficulty) params.append('difficulty', localFilters.difficulty);
      if (localFilters.search) params.append('q', localFilters.search);
      params.append('source', 'database');
      params.append('limit', '100');
      console.log('Local recipe search params:', params.toString());
      const response = await fetch(`/api/recipes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch recipes from database');
      const data = await response.json();
      console.log('Recipes returned:', data.recipes?.length);
      setMeals(data.recipes || []);
    } catch (err) {
      setError('Failed to load recipes from database.');
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    setError('');
    setMeals([]);
    setWeeklyPlan(null);

    if (!useAI) {
      await fetchLocalRecipes();
      return;
    }

    // Validate required fields
    if (!preferences.cuisine || !preferences.dietary || !preferences.minDailyBudget || !preferences.maxDailyBudget || !preferences.numberOfPeople || !preferences.availableTime) {
      setError('Please fill in all required fields: Cuisine, Diet Type, Budget Range, People, and Available Time.');
      setLoading(false);
      return;
    }

    // Prepare payload with only filled fields
    const payload = Object.fromEntries(Object.entries(preferences).filter(([_, v]) => v !== '' && v !== undefined));

    try {
      const response = await fetch('/api/meal-plan/ai/intelligent-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // <== ✅ IMPORTANT
        body: JSON.stringify({
          suggestionType: mode,
          additionalPreferences: payload,
          ...(mode === 'meals' ? { numberOfUniqueMeals: 21 } : {})
        })
      });
    
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error || `HTTP error! status: ${response.status}`);
      }
    
      const data = await response.json();
    
      if (mode === 'meals') {
        if (data.success && Array.isArray(data.data)) {
          setMeals(data.data);
        } else {
          setError(data.error || 'Failed to generate suggestions');
        }
      } else if (mode === 'weekly-plan') {
        if (data.success && data.data && Array.isArray(data.data.days)) {
          setWeeklyPlan(data.data);
        } else {
          setError(data.error || 'Failed to generate weekly meal plan');
        }
      }
    } catch (err: any) {
      setError((err as Error).message || 'Failed to fetch meal suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, useAI]);

  // Ensure meals is always an array
  const safeMeals = Array.isArray(meals) ? meals : [];
  // Debug log for backend data
  console.log('Raw meals from backend:', safeMeals);
  console.log('Number of meals from backend:', safeMeals.length);
  
  // Robust filter: allow recipes with non-empty ingredients (objects or strings) and at least one instruction (string or array)
  const completeMeals = safeMeals.filter(m => {
    // Add more details to meal debugging
    console.log('Checking meal:', m.name);
    console.log('  Full meal object structure:', JSON.stringify(m, null, 2));
    
    // Check ingredients in more detail
    const hasIngredients = Array.isArray(m.ingredients) && m.ingredients.length > 0;
    console.log('  Has ingredients array:', Array.isArray(m.ingredients));
    console.log('  Ingredients length:', Array.isArray(m.ingredients) ? m.ingredients.length : 'N/A');
    
    if (Array.isArray(m.ingredients) && m.ingredients.length > 0) {
      console.log('  First ingredient sample:', JSON.stringify(m.ingredients[0], null, 2));
    }
    
    // Check instructions in more detail
    const hasInstructions =
      (Array.isArray(m.instructions) && m.instructions.length > 0) ||
      (typeof m.instructions === 'string' && typeof (m.instructions as string)?.trim === 'function' && (m.instructions as string).trim().length > 0);
    
    console.log('  Has instructions array:', Array.isArray(m.instructions));
    console.log('  Instructions length:', Array.isArray(m.instructions) ? m.instructions.length : 'N/A');
    console.log('  Instructions is string:', typeof m.instructions === 'string');
    console.log('  Instructions as string length:', typeof m.instructions === 'string' ? (m.instructions as string)?.length : 'N/A');
    
    if (Array.isArray(m.instructions) && m.instructions.length > 0) {
      console.log('  First instruction sample:', m.instructions[0]);
    } else if (typeof m.instructions === 'string') {
      console.log('  Instructions string sample:', (m.instructions as string)?.substring ? (m.instructions as string).substring(0, 50) + '...' : '');
    }
    
    // Log the final decision
    console.log('  Will this meal be included?', hasIngredients && hasInstructions);
    console.log('-------------------------------------------');
    
    return hasIngredients && hasInstructions;
  });
  console.log('Number of meals after filtering:', completeMeals.length);
  const filteredMeals = filter
    ? completeMeals.filter(m => 
        typeof m.name === 'string' && m.name.toLowerCase().includes(filter.toLowerCase()) || 
        (typeof m.type === 'string' && m.type.toLowerCase().includes(filter.toLowerCase())) ||
        (typeof m.cuisine === 'string' && m.cuisine.toLowerCase().includes(filter.toLowerCase()))
      )
    : completeMeals;

  // Selection logic: allow min 1, max 21
  const maxSelectable = 21;
  const minSelectable = 1;

  const handleSelect = (idx: number) => {
    setSelected(sel => {
      const next = new Set(sel);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        if (next.size < maxSelectable) {
          next.add(idx);
        }
      }
      return next;
    });
  };

  const handleContinue = () => {
    if (selected.size < minSelectable) return;
    
    // Get the selected meals
    const selectedMeals = Array.from(selected).map(i => meals[i]);
    
    // Save to localStorage for the grocery list component
    localStorage.setItem('selectedMeals', JSON.stringify(selectedMeals));
    
    // Navigate to grocery list tab
    // Since we're in a tabbed interface, we need to trigger the tab change
    // We'll use a custom event to communicate with the parent component
    const event = new CustomEvent('switchToGroceryList', {
      detail: { selectedMeals }
    });
    window.dispatchEvent(event);
  };

  const handleRegenerate = () => {
    generateSuggestions();
  };

  const handleViewRecipe = (meal: Meal, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card selection when clicking view button
    setViewingMeal(meal);
  };

  const handleCloseModal = () => {
    setViewingMeal(null);
  };

  // Validation for required fields
  const isFormValid =
  preferences.cuisine?.trim() !== '' &&
  preferences.dietary?.trim() !== '' &&
  !isNaN(Number(preferences.minDailyBudget)) && Number(preferences.minDailyBudget) > 0 &&
  !isNaN(Number(preferences.maxDailyBudget)) && Number(preferences.maxDailyBudget) > 0 &&
  !isNaN(Number(preferences.numberOfPeople)) && Number(preferences.numberOfPeople) > 0 &&
  preferences.availableTime?.trim() !== '';


  // Save meal plan from selection page
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSaveMealPlan = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      // Get selected meals
      const selectedMealsArr = Array.from(selected).map(i => meals[i]).filter((meal): meal is Meal => !!meal);
      // Calculate totalCalories
      let totalCalories = 0;
      selectedMealsArr.forEach(meal => {
        // Type guard for calories property
        if (meal.nutrition && typeof meal.nutrition === 'object' && meal.nutrition !== null && 'calories' in meal.nutrition && typeof (meal.nutrition as Nutrition).calories === 'number') {
          totalCalories += (meal.nutrition as Nutrition).calories;
        } else if (typeof meal === 'object' && meal !== null && 'calories' in meal && typeof (meal as any).calories === 'number') {
          totalCalories += (meal as any).calories;
        }
      });
      // Prompt for title/description
      const title = window.prompt('Enter a title for your meal plan:', 'My Custom Meal Plan') || 'My Custom Meal Plan';
      const description = window.prompt('Enter a description (optional):', 'A meal plan generated from selected recipes.') || '';
      const totalCost = selectedMealsArr.reduce((sum, meal) => {
        if (!meal) return sum;
        if (typeof meal.estimatedCost === 'number') return sum + meal.estimatedCost;
        if (typeof meal === 'object' && meal !== null && 'cost' in meal && typeof (meal as any).cost === 'number') return sum + (meal as any).cost;
        return sum;
      }, 0);
      const location = 'Home';
      const dietType = ['balanced'];
      const res = await fetch('/api/savedmealplans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensure cookies/session are sent
        body: JSON.stringify({
          title,
          description,
          budget: totalCost,
          location,
          dietType,
          selectedMeals: selectedMealsArr,
          groceryList: [],
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
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error saving meal plan');
    } finally {
      setSaving(false);
    }
  };

  // Add useEffect to log viewingMeal when it changes
  useEffect(() => {
    if (viewingMeal) {
      console.log('Viewing meal:', viewingMeal);
    }
  }, [viewingMeal]);

  return (
    <div className="p-6">
      {/* AI/Local Toggle */}
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useAI}
            onChange={() => setUseAI(v => !v)}
            className="form-checkbox h-5 w-5 text-emerald-600"
          />
          <span className="ml-2 text-emerald-800 font-semibold">
            {useAI ? 'AI Meal Suggestions' : 'Local Recipe Search'}
          </span>
        </label>
        <span className="text-xs text-gray-500">Switch between AI-powered and local MongoDB recipes</span>
      </div>
      {/* Filter UI */}
      {useAI ? (
        // AI filter UI (existing preferences)
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-8 border border-emerald-100">
          <h3 className="text-xl font-semibold text-emerald-800 mb-4">🤖 AI-Powered Preferences</h3>
        
        {/* Basic Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
            <select 
              value={preferences.cuisine}
              onChange={(e) => setPreferences(prev => ({ ...prev, cuisine: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="any">Any Cuisine</option>
              <option value="italian">Italian</option>
              <option value="mexican">Mexican</option>
              <option value="indian">Indian</option>
              <option value="chinese">Chinese</option>
              <option value="mediterranean">Mediterranean</option>
              <option value="american">American</option>
              <option value="japanese">Japanese</option>
              <option value="thai">Thai</option>
              <option value="french">French</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
            <select 
              value={preferences.dietary}
              onChange={(e) => setPreferences(prev => ({ ...prev, dietary: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="balanced">Balanced</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="low-carb">Low Carb</option>
              <option value="high-protein">High Protein</option>
              <option value="keto">Keto</option>
              <option value="paleo">Paleo</option>
              <option value="gluten-free">Gluten Free</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range ($/day)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={preferences.minDailyBudget}
                onChange={e => setPreferences(prev => ({ ...prev, minDailyBudget: e.target.value.replace(/^0+(?!$)/, '') }))}
                className="w-20 px-2 py-1 border rounded"
                placeholder="Min"
                required
              />
              <input
                type="number"
                min="0"
                value={preferences.maxDailyBudget}
                onChange={e => setPreferences(prev => ({ ...prev, maxDailyBudget: e.target.value.replace(/^0+(?!$)/, '') }))}
                className="w-20 px-2 py-1 border rounded"
                placeholder="Max"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">People</label>
            <input
              type="number"
              value={preferences.numberOfPeople}
              onChange={(e) => setPreferences(prev => ({ ...prev, numberOfPeople: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              min="1"
              max="10"
            />
          </div>
        </div>

        {/* Advanced AI Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Skill</label>
            <select 
              value={preferences.cookingSkill}
              onChange={(e) => setPreferences(prev => ({ ...prev, cookingSkill: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available Time</label>
            <select 
              value={preferences.availableTime}
              onChange={(e) => setPreferences(prev => ({ ...prev, availableTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="15-30 minutes">15-30 minutes</option>
              <option value="30-60 minutes">30-60 minutes</option>
              <option value="1-2 hours">1-2 hours</option>
              <option value="2+ hours">2+ hours</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
            <select 
              value={preferences.seasonalPreferences}
              onChange={(e) => setPreferences(prev => ({ ...prev, seasonalPreferences: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="any">Any Season</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="fall">Fall</option>
              <option value="winter">Winter</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
            <select 
              value={preferences.occasion}
              onChange={(e) => setPreferences(prev => ({ ...prev, occasion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="daily">Daily Meals</option>
              <option value="weekend">Weekend Cooking</option>
              <option value="special">Special Occasion</option>
              <option value="quick">Quick & Easy</option>
            </select>
          </div>
        </div>

        {/* Text Inputs for Ingredients and Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Ingredients (comma-separated)</label>
            <input
              type="text"
              value={preferences.favoriteIngredients}
              onChange={e => setPreferences(prev => ({ ...prev, favoriteIngredients: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="chicken, quinoa, spinach, tomatoes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Health Goals (comma-separated)</label>
            <input
              type="text"
              value={preferences.healthGoals}
              onChange={e => setPreferences(prev => ({ ...prev, healthGoals: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="weight loss, muscle gain, heart health"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleRegenerate}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
            disabled={!isFormValid || loading}
          >
            🤖 Generate AI Suggestions
          </button>
          {!isFormValid && (
            <div className="text-red-500 text-sm mt-2">
              Please fill in all required fields.
            </div>
          )}
        </div>
      </div>
      ) : (
        // Local filter UI
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-8 border border-emerald-100">
          <h3 className="text-xl font-semibold text-emerald-800 mb-4">🍲 Local Recipe Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
              <select
                value={localFilters.cuisine}
                onChange={e => setLocalFilters(f => ({ ...f, cuisine: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Any</option>
                <option value="Italian">Italian</option>
                <option value="Mexican">Mexican</option>
                <option value="Indian">Indian</option>
                <option value="Chinese">Chinese</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="American">American</option>
                <option value="Japanese">Japanese</option>
                <option value="Thai">Thai</option>
                <option value="French">French</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
              <select
                value={localFilters.dietary}
                onChange={e => setLocalFilters(f => ({ ...f, dietary: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Any</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="low-carb">Low Carb</option>
                <option value="high-protein">High Protein</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
                <option value="gluten-free">Gluten Free</option>
              </select>
            </div>
            {/* Removed Type filter dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={localFilters.difficulty}
                onChange={e => setLocalFilters(f => ({ ...f, difficulty: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Any</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Search by name..."
              value={localFilters.search}
              onChange={e => setLocalFilters(f => ({ ...f, search: e.target.value }))}
            />
            <button
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700"
              onClick={fetchLocalRecipes}
              disabled={loading}
            >
              Search
            </button>
          </div>
        </div>
      )}
      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="🔍 Search meals by name, type, or cuisine..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 font-medium">
            {selected.size} selected
          </span>
          <button
            className={`bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed ${
              selected.size >= minSelectable
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={selected.size < minSelectable}
            onClick={handleContinue}
          >
            Continue to Grocery List ({selected.size}/{maxSelectable})
          </button>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-gray-600">Generating personalized meal suggestions...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="mb-4 flex gap-4">
        <button
          className={`px-4 py-2 rounded ${mode === 'weekly-plan' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setMode('weekly-plan')}
        >
          Weekly Meal Plan
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === 'meals' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setMode('meals')}
        >
          Flat Meal Suggestions
        </button>
      </div>
      {mode === 'weekly-plan' && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
          <strong>Note:</strong> Selection is only available in <span className="font-semibold">Flat Meal Suggestions</span> mode. Switch to that tab to pick your meals and continue to the grocery list.
        </div>
      )}
      {/* Weekly Plan Display */}
      {mode === 'weekly-plan' && weeklyPlan && Array.isArray((weeklyPlan as any).days) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {((weeklyPlan as any).days as any[]).map((day, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow p-4 border border-emerald-100">
              <h3 className="text-lg font-bold text-emerald-800 mb-2">{typeof day.dayName === 'string' ? day.dayName : `Day ${day.day}`}</h3>
              <div className="space-y-4">
                {Array.isArray(day.meals) && day.meals.map((meal: any, mIdx: number) => (
                  <div key={mIdx} className="border rounded p-3 mb-2">
                    <div className="font-semibold capitalize">{typeof meal.type === 'string' ? meal.type : ''}</div>
                    <div className="text-gray-700 font-bold">{typeof meal.name === 'string' ? meal.name : ''}</div>
                    <div className="text-xs text-gray-500">Calories: {
                      meal.nutrition && typeof meal.nutrition === 'object' && meal.nutrition !== null && 'calories' in meal.nutrition && typeof (meal.nutrition as Nutrition).calories === 'number'
                        ? (meal.nutrition as Nutrition).calories
                        : (typeof meal === 'object' && meal !== null && 'calories' in meal && typeof (meal as any).calories === 'number' ? (meal as any).calories : '')
                    }, Cost: {
                      typeof meal.estimatedCost === 'number'
                        ? meal.estimatedCost
                        : (typeof meal === 'object' && meal !== null && 'cost' in meal && typeof (meal as any).cost === 'number' ? (meal as any).cost : '')
                    }
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Ingredients: {Array.isArray(meal.ingredients) ? meal.ingredients.map((ing: any) => typeof ing === 'object' && ing !== null && 'name' in ing && typeof ing.name === 'string' ? ing.name : typeof ing === 'string' ? ing : '').join(", ") : '-'}</div>
                    <div className="text-xs text-gray-400 mt-1">Instructions: {Array.isArray(meal.instructions) ? meal.instructions.map((inst: unknown) => typeof inst === 'string' ? inst : '').join(' ') : '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Flat Meal Suggestions Display */}
      {mode === 'meals' && meals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((meal, idx) => {
            const isSelected = selected.has(idx);
            return (
              <div
                key={idx}
                className={`bg-white rounded-xl shadow p-4 border-2 transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 ring-4 ring-emerald-200 shadow-emerald-500/25 bg-emerald-50'
                    : 'border-gray-100 hover:border-emerald-200'
                }`}
                onClick={() => handleSelect(idx)}
              >
                <div className="font-semibold capitalize">{typeof meal.type === 'string' ? meal.type : ''}</div>
                <div className="text-gray-700 font-bold">{typeof meal.name === 'string' ? meal.name : ''}</div>
                <div className="text-xs text-gray-500">Calories: {
                  meal.nutrition && typeof meal.nutrition === 'object' && meal.nutrition !== null && 'calories' in meal.nutrition && typeof (meal.nutrition as Nutrition).calories === 'number'
                    ? (meal.nutrition as Nutrition).calories
                    : (typeof meal === 'object' && meal !== null && 'calories' in meal && typeof (meal as any).calories === 'number' ? (meal as any).calories : '')
                }, Cost: {
                  typeof meal.estimatedCost === 'number'
                    ? meal.estimatedCost
                    : (typeof meal === 'object' && meal !== null && 'cost' in meal && typeof (meal as any).cost === 'number' ? (meal as any).cost : '')
                }
                </div>
                <div className="text-xs text-gray-400 mt-1">Ingredients: {Array.isArray(meal.ingredients) ? meal.ingredients.map((ing: any) => typeof ing === 'object' && ing !== null && 'name' in ing && typeof ing.name === 'string' ? ing.name : typeof ing === 'string' ? ing : '').join(", ") : '-'}</div>
                <div className="text-xs text-gray-400 mt-1">Instructions: {Array.isArray(meal.instructions) ? meal.instructions.map((inst: unknown) => typeof inst === 'string' ? inst : '').join(' ') : '-'}</div>
                {isSelected && <div className="mt-2 text-emerald-700 font-bold text-xs">Selected</div>}
              </div>
            );
          })}
        </div>
      )}
      {/* Continue button logic */}
      <div className="mt-6 flex justify-end gap-4">
        <button
          className={`px-6 py-2 rounded-lg font-semibold text-white ${
            mode === 'meals'
              ? (selected.size >= minSelectable
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-gray-400 cursor-not-allowed')
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          disabled={mode !== 'meals' || selected.size < minSelectable}
          onClick={handleContinue}
        >
          Continue to Grocery List ({selected.size}/{maxSelectable})
        </button>
        {/* Save Meal Plan Button */}
        {mode === 'meals' && selected.size >= minSelectable && (
          <button
            className={`px-6 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={saving}
            onClick={handleSaveMealPlan}
          >
            {saving ? 'Saving...' : 'Save Meal Plan'}
          </button>
        )}
      </div>
      {saveSuccess && <div className="mt-2 text-green-700 font-semibold">Meal plan saved successfully!</div>}
      {saveError && <div className="mt-2 text-red-600 font-semibold">{saveError}</div>}

      {/* Empty State */}
      {!loading && !error && filteredMeals.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No meals found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or preferences</p>
          <button
            onClick={handleRegenerate}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300"
          >
            Generate New Suggestions
          </button>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {viewingMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-2xl p-6 border-b border-gray-200 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{typeof viewingMeal.name === 'string' ? viewingMeal.name : ''}</h2>
                <div className="flex flex-wrap gap-2">
                  {typeof viewingMeal.type === 'string' && viewingMeal.type ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full font-medium">
                      {viewingMeal.type}
                    </span>
                  ) : null}
                  {typeof viewingMeal.cuisine === 'string' && viewingMeal.cuisine ? (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                      {viewingMeal.cuisine}
                    </span>
                  ) : null}
                  {typeof viewingMeal.dietary === 'string' && viewingMeal.dietary ? (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                      {viewingMeal.dietary}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Image and Basic Info */}
                <div>
                  {/* Recipe Image */}
                  <div className="mb-6">
                    {typeof viewingMeal.image === 'string' && viewingMeal.image ? (
                      <img 
                        src={viewingMeal.image} 
                        alt={typeof viewingMeal.name === 'string' ? viewingMeal.name : ''} 
                        className="w-full h-64 object-cover rounded-xl shadow-lg"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                        <div className="text-8xl">🍽️</div>
                      </div>
                    )}
                  </div>
                  {/* Recipe Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Prep Time</div>
                      <div className="text-lg font-semibold">{typeof viewingMeal.prepTime === 'number' ? viewingMeal.prepTime : 0} min</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Cook Time</div>
                      <div className="text-lg font-semibold">{typeof viewingMeal.cookTime === 'number' ? viewingMeal.cookTime : 0} min</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Difficulty</div>
                      <div className="text-lg font-semibold">{typeof viewingMeal.difficulty === 'string' ? viewingMeal.difficulty : 'Medium'}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Cost</div>
                      <div className="text-lg font-semibold text-emerald-600">
                        ${typeof viewingMeal.estimatedCost === 'number' 
                          ? viewingMeal.estimatedCost.toFixed(2) 
                          : typeof viewingMeal.estimatedCost === 'string'
                            ? parseFloat(viewingMeal.estimatedCost).toFixed(2)
                            : '0.00'
                        }
                      </div>
                    </div>
                  </div>
                  {/* Nutrition Info */}
                  <div className="bg-emerald-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-emerald-800 mb-3">Nutrition Facts</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calories:</span>
                        <span className="font-medium">{typeof viewingMeal.nutrition === 'object' && viewingMeal.nutrition !== null && 'calories' in viewingMeal.nutrition ? (viewingMeal.nutrition as Nutrition).calories : 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protein:</span>
                        <span className="font-medium">{typeof viewingMeal.nutrition === 'object' && viewingMeal.nutrition !== null && 'protein' in viewingMeal.nutrition ? (viewingMeal.nutrition as Nutrition).protein : 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Carbs:</span>
                        <span className="font-medium">{typeof viewingMeal.nutrition === 'object' && viewingMeal.nutrition !== null && 'carbs' in viewingMeal.nutrition ? (viewingMeal.nutrition as Nutrition).carbs : 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fat:</span>
                        <span className="font-medium">{typeof viewingMeal.nutrition === 'object' && viewingMeal.nutrition !== null && 'fat' in viewingMeal.nutrition ? (viewingMeal.nutrition as Nutrition).fat : 0}g</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right Column - Ingredients and Instructions */}
                <div>
                  {/* Description */}
                  {typeof viewingMeal.description === 'string' && viewingMeal.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                      <p className="text-gray-600 leading-relaxed">{viewingMeal.description}</p>
                    </div>
                  )}
                  {/* AI Recommendations */}
                  {typeof viewingMeal.whyRecommended === 'string' && viewingMeal.whyRecommended && (
                    <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <h3 className="text-lg font-semibold text-emerald-800 mb-2">🤖 AI Recommendation</h3>
                      <p className="text-emerald-700 mb-2">{viewingMeal.whyRecommended}</p>
                      {typeof viewingMeal.healthBenefits === 'string' && viewingMeal.healthBenefits && (
                        <p className="text-sm text-emerald-600"><strong>Health Benefits:</strong> {viewingMeal.healthBenefits}</p>
                      )}
                      {typeof viewingMeal.budgetFriendly === 'string' && viewingMeal.budgetFriendly && (
                        <p className="text-sm text-emerald-600"><strong>Budget:</strong> {viewingMeal.budgetFriendly}</p>
                      )}
                      {typeof viewingMeal.timeEfficient === 'string' && viewingMeal.timeEfficient && (
                        <p className="text-sm text-emerald-600"><strong>Time:</strong> {viewingMeal.timeEfficient}</p>
                      )}
                    </div>
                  )}
                  {/* Ingredients */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h3>
                    <div className="space-y-2">
                      {Array.isArray(viewingMeal.ingredients) && viewingMeal.ingredients.length > 0 ? (
                        viewingMeal.ingredients
                          .filter(ingredient => ingredient !== undefined && ingredient !== null && (typeof ingredient === 'string' || typeof ingredient === 'number' || (typeof ingredient === 'object' && 'name' in ingredient)))
                          .map((ingredient, index) => (
                            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                              <span className="text-gray-700">
                                {typeof ingredient === 'object' && ingredient !== null && 'quantity' in ingredient && 'unit' in ingredient && 'name' in ingredient && typeof (ingredient as any).quantity === 'string' && typeof (ingredient as any).unit === 'string' && typeof (ingredient as any).name === 'string'
                                  ? `${(ingredient as any).quantity} ${(ingredient as any).unit} ${(ingredient as any).name}`
                                  : typeof ingredient === 'string'
                                    ? ingredient
                                    : typeof ingredient === 'number'
                                      ? String(ingredient)
                                      : ''}
                              </span>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500 italic">No ingredients listed</p>
                      )}
                    </div>
                  </div>
                  {/* Instructions */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Instructions</h3>
                    <div className="space-y-3">
                      {Array.isArray(viewingMeal.instructions) && viewingMeal.instructions.length > 0 ? (
                        viewingMeal.instructions
                          .filter(instruction => instruction !== undefined && instruction !== null && (typeof instruction === 'string' || typeof instruction === 'number'))
                          .map((instruction, index) => (
                            <div key={index} className="flex">
                              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                                {index + 1}
                              </div>
                              <p className="text-gray-700 leading-relaxed pt-1">{typeof instruction === 'string' ? instruction : typeof instruction === 'number' ? String(instruction) : ''}</p>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500 italic">No instructions available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tailwind utility classes for .input and .btn are as before. 