'use client';

import { useState } from 'react';
import { searchRecipesWithAI } from '@/app/lib/aiUtils';

// Nutrition interface for type safety
interface Nutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fat?: number;
}

interface Recipe {
  name: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: Nutrition;
  [key: string]: unknown;
}

export default function TestAIPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAISearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const recipes = await searchRecipesWithAI(searchQuery, {
        cuisine: 'any',
        dietType: 'balanced',
        maxCalories: 500,
        maxCost: 20
      });

      // Type guard: filter only objects with name, ingredients, and instructions
      const validRecipes = Array.isArray(recipes)
        ? recipes.filter(
            (r): r is Recipe =>
              typeof r === 'object' && r !== null &&
              'name' in r && typeof r.name === 'string' &&
              'ingredients' in r && Array.isArray(r.ingredients) &&
              'instructions' in r && Array.isArray(r.instructions)
          )
        : [];
      setResults(validRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🤖 Mistral AI Recipe Search Test
        </h1>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter recipe search query (e.g., 'quick pasta dinner')"
              className="flex-1 p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              onClick={testAISearch}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? '🔍 Searching...' : '🔍 Test AI Search'}
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-center py-4 bg-red-500/10 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              AI Generated Recipes ({results.length})
            </h2>
            
            {results.map((recipe, index) => (
              <div
                key={typeof recipe._id === 'string' || typeof recipe._id === 'number' ? recipe._id : index}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {recipe.name}
                  </h3>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                    🤖 AI Generated
                  </span>
                </div>
                
                <p className="text-gray-400 mb-4">{typeof recipe.description === 'string' ? recipe.description : ''}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="text-gray-400">
                    <span className="block font-medium text-emerald-400">Cuisine</span>
                    {typeof recipe.cuisine === 'string' ? recipe.cuisine : ''}
                  </div>
                  <div className="text-gray-400">
                    <span className="block font-medium text-emerald-400">Diet</span>
                    {typeof recipe.dietType === 'string' ? recipe.dietType : ''}
                  </div>
                  <div className="text-gray-400">
                    <span className="block font-medium text-emerald-400">Prep Time</span>
                    {typeof recipe.prepTime === 'number' ? recipe.prepTime : ''} mins
                  </div>
                  <div className="text-gray-400">
                    <span className="block font-medium text-emerald-400">Cost</span>
                    ${typeof recipe.estimatedCost === 'number' ? recipe.estimatedCost : ''}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                  <h4 className="text-emerald-400 font-medium mb-2">Nutrition (per serving)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-gray-300">
                      <span className="text-emerald-400">Calories:</span> {recipe.nutrition && typeof recipe.nutrition === 'object' && recipe.nutrition !== null && 'calories' in recipe.nutrition ? (recipe.nutrition as Nutrition).calories : 'N/A'}
                    </div>
                    <div className="text-gray-300">
                      <span className="text-emerald-400">Protein:</span> {recipe.nutrition && typeof recipe.nutrition === 'object' && recipe.nutrition !== null && 'protein' in recipe.nutrition ? (recipe.nutrition as Nutrition).protein : 'N/A'}g
                    </div>
                    <div className="text-gray-300">
                      <span className="text-emerald-400">Carbs:</span> {recipe.nutrition && typeof recipe.nutrition === 'object' && recipe.nutrition !== null && 'carbs' in recipe.nutrition ? (recipe.nutrition as Nutrition).carbs : 'N/A'}g
                    </div>
                    <div className="text-gray-300">
                      <span className="text-emerald-400">Fats:</span> {recipe.nutrition && typeof recipe.nutrition === 'object' && recipe.nutrition !== null && (('fats' in recipe.nutrition && (recipe.nutrition as Nutrition).fats !== undefined) || ('fat' in recipe.nutrition && (recipe.nutrition as Nutrition).fat !== undefined)) ? (recipe.nutrition as Nutrition).fats ?? (recipe.nutrition as Nutrition).fat : 'N/A'}g
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-emerald-400 font-medium mb-2">Ingredients</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      {recipe.ingredients?.map((ingredient: string, i: number) => (
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
                      {recipe.instructions?.map((instruction: string, i: number) => (
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