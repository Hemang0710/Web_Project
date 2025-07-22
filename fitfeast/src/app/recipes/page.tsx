'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { Dialog } from '@headlessui/react';
import Image from 'next/image';
import FitFeastLayout from '../components/layout/FitFeastLayout';
import ProtectedRoute from '../components/ProtectedRoute';

interface Recipe {
  _id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  prepTime: number;
  cookTime: number;
  difficulty: string;
  cuisine: string;
  dietType: string;
  estimatedCost: number;
  image?: string;
  source?: string;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [dietType, setDietType] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [maxCalories, setMaxCalories] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearch = useRef(
    debounce(async (searchParams: URLSearchParams, useAISearch: boolean) => {
      try {
        let response;
        if (useAISearch) {
          // Use AI-powered search
          response = await fetch('/api/ai/recipe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              searchQuery: searchParams.get('q') || '',
              filters: {
                cuisine: searchParams.get('cuisine') || undefined,
                dietType: searchParams.get('dietType') || undefined,
                maxCalories: searchParams.get('maxCalories') ? parseInt(searchParams.get('maxCalories')!) : undefined,
                maxCost: searchParams.get('maxCost') ? parseFloat(searchParams.get('maxCost')!) : undefined,
              },
              searchType: 'search'
            })
          });
        } else {
          // Use regular search
          response = await fetch(`/api/recipes?${searchParams}`);
        }
        
        if (!response.ok) throw new Error('Failed to fetch recipes');
        const data = await response.json();
        setRecipes(data.recipes);
        setTotalPages(Math.ceil(data.total / 9));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }, 500)
  ).current;

  const searchRecipes = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        ...(searchQuery && { q: searchQuery }),
        ...(cuisine && { cuisine }),
        ...(dietType && { dietType }),
        ...(maxCost && { maxCost }),
        ...(maxCalories && { maxCalories })
      });

      params.append('page', currentPage.toString());
      params.append('limit', '9');
      await debouncedSearch(params, useAI);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, cuisine, dietType, maxCost, maxCalories, currentPage, useAI, debouncedSearch]);

  useEffect(() => {
    searchRecipes();
  }, [searchRecipes]);

  return (
    <ProtectedRoute>
      <FitFeastLayout>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <div className="max-w-screen-2xl mx-auto px-4 py-10 sm:px-8 lg:px-12">
            {/* Header Section */}
            <div className="text-center mb-10">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-emerald-700 mb-4 tracking-tight animate-fade-in">
                Recipe <span className="text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text">Search</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up">
                Find budget-friendly, nutritious recipes tailored to your preferences
              </p>
            </div>

            {/* Search Filters */}
            <div className="bg-white/90 border border-emerald-100 rounded-3xl p-8 mb-10 shadow-xl animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recipes..."
                    className="w-full p-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine</label>
                  <select
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 transition"
                  >
                    <option value="">All Cuisines</option>
                    <option value="italian">Italian</option>
                    <option value="indian">Indian</option>
                    <option value="mexican">Mexican</option>
                    <option value="chinese">Chinese</option>
                    <option value="japanese">Japanese</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diet Type</label>
                  <select
                    value={dietType}
                    onChange={(e) => setDietType(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 transition"
                  >
                    <option value="">All Types</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="gluten-free">Gluten Free</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Cost ($)</label>
                  <input
                    type="number"
                    value={maxCost}
                    onChange={(e) => setMaxCost(e.target.value)}
                    placeholder="Enter max cost"
                    className="w-full p-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Calories</label>
                  <input
                    type="number"
                    value={maxCalories}
                    onChange={(e) => setMaxCalories(e.target.value)}
                    placeholder="Enter max calories"
                    className="w-full p-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Method</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!useAI}
                        onChange={() => setUseAI(false)}
                        className="mr-2 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-gray-700">Regular Search</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={useAI}
                        onChange={() => setUseAI(true)}
                        className="mr-2 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-gray-700">AI-Powered Search</span>
                    </label>
                  </div>
                  {useAI && (
                    <p className="text-sm text-emerald-500 mt-1">
                      🤖 Using Mistral AI for intelligent recipe search
                    </p>
                  )}
                </div>

                <div className="flex justify-center mt-6 md:col-span-3">
                  <button
                    onClick={searchRecipes}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
                  >
                    {useAI ? '🔍 AI Search Recipes' : 'Search Recipes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-center py-4">
                {error}
              </div>
            )}

            {/* Recipe Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-10 animate-fade-in-up">
              {recipes.map((recipe) => (
                <div
                  key={recipe._id}
                  onClick={() => {
                    setSelectedRecipe(recipe);
                    setIsModalOpen(true);
                  }}
                  className="bg-white/90 border border-emerald-100 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-lg"
                >
                  {recipe.image && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={recipe.image}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                        width={400}
                        height={200}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-emerald-700">
                        {recipe.name}
                      </h3>
                      {recipe.source === 'ai-generated' && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full">
                          🤖 AI Generated
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {recipe.description}
                    </p>
                    
                    {/* Recipe Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="text-gray-500">
                        <span className="block font-medium text-emerald-500">Prep Time</span>
                        {recipe.prepTime} mins
                      </div>
                      <div className="text-gray-500">
                        <span className="block font-medium text-emerald-500">Cook Time</span>
                        {recipe.cookTime} mins
                      </div>
                      <div className="text-gray-500">
                        <span className="block font-medium text-emerald-500">Cuisine</span>
                        {recipe.cuisine}
                      </div>
                      <div className="text-gray-500">
                        <span className="block font-medium text-emerald-500">Diet Type</span>
                        {recipe.dietType}
                      </div>
                    </div>

                    {/* Nutrition Info */}
                    <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                      <h4 className="text-emerald-700 font-medium mb-2">Nutrition (per serving)</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>Calories: {recipe.nutrition.calories}</div>
                        <div>Protein: {recipe.nutrition.protein}g</div>
                        <div>Carbs: {recipe.nutrition.carbs}g</div>
                        <div>Fats: {recipe.nutrition.fats}g</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700 font-semibold">
                        ${recipe.estimatedCost.toFixed(2)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {recipe.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-emerald-700 font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {/* Recipe Detail Modal */}
            <Dialog
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              className="relative z-50"
            >
              <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-3xl p-6 overflow-y-auto max-h-[90vh] animate-fade-in-up">
                  {selectedRecipe && (
                    <div>
                      {selectedRecipe.image && (
                        <div className="relative h-64 mb-6">
                          <Image
                            src={selectedRecipe.image}
                            alt={selectedRecipe.name}
                            className="rounded-2xl object-cover"
                            fill
                          />
                        </div>
                      )}
                      <h2 className="text-2xl font-bold text-emerald-700 mb-4">{selectedRecipe.name}</h2>
                      <p className="text-gray-600 mb-6">{selectedRecipe.description}</p>

                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-emerald-700 mb-3">Ingredients</h3>
                          <ul className="list-disc list-inside text-gray-600">
                            {selectedRecipe.ingredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-emerald-700 mb-3">Instructions</h3>
                          <ol className="list-decimal list-inside text-gray-600">
                            {selectedRecipe.instructions.map((instruction, index) => (
                              <li key={index}>{instruction}</li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-full py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </Dialog.Panel>
              </div>
            </Dialog>
          </div>
        </div>
      </FitFeastLayout>
    </ProtectedRoute>
  );
}