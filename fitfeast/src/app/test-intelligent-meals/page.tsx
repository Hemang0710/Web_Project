'use client';

import { useState } from 'react';
import { generateIntelligentMealSuggestions } from '@/app/lib/aiUtils';

interface UserData {
  cuisine: string;
  dietary: string;
  allergies: string[];
  minDailyBudget: number;
  maxDailyBudget: number;
  numberOfPeople: number;
  preferredMealTypes: string[];
  cookingSkill: string;
  availableTime: string;
  favoriteIngredients: string[];
  dislikedIngredients: string[];
  healthGoals: string[];
  seasonalPreferences: string;
  occasion: string;
}

// Nutrition interface for type safety
interface Nutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface MealSuggestion {
  name: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: Nutrition;
  [key: string]: unknown;
}

export default function TestIntelligentMealsPage() {
  const [userData, setUserData] = useState<UserData>({
    cuisine: 'italian',
    dietary: 'balanced',
    allergies: [],
    minDailyBudget: 10,
    maxDailyBudget: 25,
    numberOfPeople: 2,
    preferredMealTypes: ['breakfast', 'lunch', 'dinner'],
    cookingSkill: 'beginner',
    availableTime: '30-60 minutes',
    favoriteIngredients: [],
    dislikedIngredients: [],
    healthGoals: [],
    seasonalPreferences: 'any',
    occasion: 'daily'
  });
  const [results, setResults] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testIntelligentSuggestions = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const meals = await generateIntelligentMealSuggestions(userData);
      // Type guard: filter only objects with name, ingredients, and instructions
      const validMeals = Array.isArray(meals)
        ? meals.filter(
            (m): m is MealSuggestion =>
              typeof m === 'object' && m !== null &&
              'name' in m && typeof m.name === 'string' &&
              'ingredients' in m && Array.isArray(m.ingredients) &&
              'instructions' in m && Array.isArray(m.instructions)
          )
        : [];
      setResults(validMeals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = <K extends keyof UserData>(field: K, value: UserData[K]) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🤖 Intelligent Meal Suggestions Test
        </h1>

        {/* User Data Form */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">User Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cuisine</label>
              <select
                value={userData.cuisine}
                onChange={(e) => updateUserData('cuisine', e.target.value as string)}
                className="w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="italian">Italian</option>
                <option value="mexican">Mexican</option>
                <option value="indian">Indian</option>
                <option value="chinese">Chinese</option>
                <option value="mediterranean">Mediterranean</option>
                <option value="american">American</option>
                <option value="japanese">Japanese</option>
                <option value="thai">Thai</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Diet Type</label>
              <select
                value={userData.dietary}
                onChange={(e) => updateUserData('dietary', e.target.value as string)}
                className="w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="balanced">Balanced</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="low-carb">Low Carb</option>
                <option value="high-protein">High Protein</option>
                <option value="keto">Keto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cooking Skill</label>
              <select
                value={userData.cookingSkill}
                onChange={(e) => updateUserData('cookingSkill', e.target.value as string)}
                className="w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Available Time</label>
              <select
                value={userData.availableTime}
                onChange={(e) => updateUserData('availableTime', e.target.value as string)}
                className="w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="15-30 minutes">15-30 minutes</option>
                <option value="30-60 minutes">30-60 minutes</option>
                <option value="1-2 hours">1-2 hours</option>
                <option value="2+ hours">2+ hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Budget Range ($/day)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={userData.minDailyBudget}
                  onChange={(e) => updateUserData('minDailyBudget', Number(e.target.value))}
                  className="w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={userData.maxDailyBudget}
                  onChange={(e) => updateUserData('maxDailyBudget', Number(e.target.value))}
                  className="w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Max"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Number of People</label>
              <input
                type="number"
                value={userData.numberOfPeople}
                onChange={(e) => updateUserData('numberOfPeople', Number(e.target.value))}
                className="w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                min="1"
                max="10"
              />
            </div>
          </div>

          {/* Text Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Favorite Ingredients (comma-separated)</label>
              <input
                type="text"
                value={userData.favoriteIngredients.join(', ')}
                onChange={(e) => updateUserData('favoriteIngredients', e.target.value.split(',').map(i => i.trim()).filter(i => i))}
                className="w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="chicken, quinoa, spinach, tomatoes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Health Goals (comma-separated)</label>
              <input
                type="text"
                value={userData.healthGoals.join(', ')}
                onChange={(e) => updateUserData('healthGoals', e.target.value.split(',').map(i => i.trim()).filter(i => i))}
                className="w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="weight loss, muscle gain, heart health"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={testIntelligentSuggestions}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? '🤖 Generating...' : '🤖 Generate Intelligent Suggestions'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              🤖 AI-Generated Meal Suggestions ({results.length})
            </h2>
            
            {results.map((meal, index) => (
              <div
                key={typeof meal._id === 'string' || typeof meal._id === 'number' ? meal._id : index}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {meal.name}
                  </h3>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                    🤖 AI Personalized
                  </span>
                </div>
                
                <p className="text-gray-400 mb-4">{typeof meal.description === 'string' ? meal.description : ''}</p>
                
                {/* AI Recommendations */}
                {typeof meal.whyRecommended === 'string' && meal.whyRecommended && (
                  <div className="mb-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <h4 className="text-emerald-400 font-medium mb-2">🤖 Why This Meal is Perfect for You:</h4>
                    <p className="text-gray-300 text-sm">{meal.whyRecommended}</p>
                  </div>
                )}

                {/* Health Benefits */}
                {typeof meal.healthBenefits === 'string' && meal.healthBenefits && (
                  <div className="mb-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <h4 className="text-blue-400 font-medium mb-2">💪 Health Benefits:</h4>
                    <p className="text-gray-300 text-sm">{meal.healthBenefits}</p>
                  </div>
                )}

                {/* Budget & Time Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {typeof meal.budgetFriendly === 'string' && meal.budgetFriendly && (
                    <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                      <h4 className="text-green-400 font-medium mb-1">💰 Budget Friendly:</h4>
                      <p className="text-gray-300 text-xs">{meal.budgetFriendly}</p>
                    </div>
                  )}
                  {typeof meal.timeEfficient === 'string' && meal.timeEfficient && (
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <h4 className="text-purple-400 font-medium mb-1">⏱️ Time Efficient:</h4>
                      <p className="text-gray-300 text-xs">{meal.timeEfficient}</p>
                    </div>
                  )}
                </div>
                
                {/* Meal Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="text-gray-400">
                    <span className="block font-medium text-emerald-400">Type</span>
                    {typeof meal.type === 'string' ? meal.type : ''}
                  </div>
                  <div className="text-gray-400">
                    <span className="block font-medium text-emerald-400">Cuisine</span>
                    {typeof meal.cuisine === 'string' ? meal.cuisine : ''}
                  </div>
                  <div className="text-gray-400">
                    <span className="block font-medium text-emerald-400">Difficulty</span>
                    {typeof meal.difficulty === 'string' ? meal.difficulty : ''}
                  </div>
                  <div className="text-gray-400">
                    <span className="block font-medium text-emerald-400">Cost</span>
                    ${typeof meal.estimatedCost === 'number' ? meal.estimatedCost : ''}
                  </div>
                </div>

                {/* Nutrition Info */}
                <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                  <h4 className="text-emerald-400 font-medium mb-2">Nutrition (per serving)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-gray-300">
                      <span className="text-emerald-400">Calories:</span> {meal.nutrition && typeof meal.nutrition === 'object' && meal.nutrition !== null && 'calories' in meal.nutrition ? (meal.nutrition as Nutrition).calories : 'N/A'}
                    </div>
                    <div className="text-gray-300">
                      <span className="text-emerald-400">Protein:</span> {meal.nutrition && typeof meal.nutrition === 'object' && meal.nutrition !== null && 'protein' in meal.nutrition ? (meal.nutrition as Nutrition).protein : 'N/A'}g
                    </div>
                    <div className="text-gray-300">
                      <span className="text-emerald-400">Carbs:</span> {meal.nutrition && typeof meal.nutrition === 'object' && meal.nutrition !== null && 'carbs' in meal.nutrition ? (meal.nutrition as Nutrition).carbs : 'N/A'}g
                    </div>
                    <div className="text-gray-300">
                      <span className="text-emerald-400">Fats:</span> {meal.nutrition && typeof meal.nutrition === 'object' && meal.nutrition !== null && 'fat' in meal.nutrition ? (meal.nutrition as Nutrition).fat : 'N/A'}g
                    </div>
                  </div>
                </div>

                {/* Ingredients & Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-emerald-400 font-medium mb-2">Ingredients</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      {meal.ingredients?.map((ingredient: string, i: number) => (
                        <li key={i} className="flex items-center">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-emerald-400 font-medium mb-2">Instructions</h4>
                    <ol className="text-gray-300 text-sm space-y-1">
                      {meal.instructions?.map((instruction: string, i: number) => (
                        <li key={i} className="flex">
                          <span className="text-emerald-400 mr-2 font-medium">{i + 1}.</span>
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 