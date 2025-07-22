'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PageLayout from '../../components/layout/PageLayout';
import ProtectedRoute from '../../components/ProtectedRoute';

interface Recipe {
  _id: string;
  name: string;
  description: string;
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
    estimatedCost: number;
  }[];
  instructions: {
    step: number;
    instruction: string;
  }[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  prepTime: number;
  cookTime: number;
  difficulty: string;
  cuisine: string;
  dietType: string[];
  estimatedCost: number;
  image?: string;
  servings: number;
}

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params && typeof params.id === 'string' ? params.id : '';
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${id}`);
        if (!response.ok) throw new Error('Failed to fetch recipe');
        const data: Recipe = await response.json();
        setRecipe(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRecipe();
  }, [id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <PageLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  if (error || !recipe) {
    return (
      <ProtectedRoute>
        <PageLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="text-red-500 text-center">
              {error || 'Recipe not found'}
            </div>
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto px-4 py-8">
            {/* Recipe Header */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl overflow-hidden mb-8">
              {recipe.image && (
                <div className="relative h-96 w-full">
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-8">
                <h1 className="text-4xl font-bold text-white mb-4">{recipe.name}</h1>
                <p className="text-xl text-gray-400 mb-6">{recipe.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <span className="block text-emerald-400 font-medium">Prep Time</span>
                    <span className="text-white">{recipe.prepTime} mins</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-emerald-400 font-medium">Cook Time</span>
                    <span className="text-white">{recipe.cookTime} mins</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-emerald-400 font-medium">Difficulty</span>
                    <span className="text-white">{recipe.difficulty}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-emerald-400 font-medium">Servings</span>
                    <span className="text-white">{recipe.servings}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                    {recipe.cuisine}
                  </span>
                  {recipe.dietType.map((diet) => (
                    <span key={diet} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                      {diet}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Ingredients */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Ingredients</h2>
                  <ul className="space-y-4">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex justify-between items-center text-gray-400">
                        <span>
                          {ingredient.quantity} {ingredient.unit} {ingredient.name}
                        </span>
                        <span className="text-emerald-400">
                          ${ingredient.estimatedCost.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-6 border-t border-slate-700/50">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">Total Cost</span>
                      <span className="text-emerald-400 font-bold">
                        ${recipe.estimatedCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nutrition Information */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 mt-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Nutrition</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-gray-400">
                      <span className="block font-medium text-emerald-400">Calories</span>
                      {recipe.nutrition.calories}
                    </div>
                    <div className="text-gray-400">
                      <span className="block font-medium text-emerald-400">Protein</span>
                      {recipe.nutrition.protein}g
                    </div>
                    <div className="text-gray-400">
                      <span className="block font-medium text-emerald-400">Carbs</span>
                      {recipe.nutrition.carbs}g
                    </div>
                    <div className="text-gray-400">
                      <span className="block font-medium text-emerald-400">Fats</span>
                      {recipe.nutrition.fats}g
                    </div>
                    {recipe.nutrition.fiber && (
                      <div className="text-gray-400">
                        <span className="block font-medium text-emerald-400">Fiber</span>
                        {recipe.nutrition.fiber}g
                      </div>
                    )}
                    {recipe.nutrition.sugar && (
                      <div className="text-gray-400">
                        <span className="block font-medium text-emerald-400">Sugar</span>
                        {recipe.nutrition.sugar}g
                      </div>
                    )}
                    {recipe.nutrition.sodium && (
                      <div className="text-gray-400">
                        <span className="block font-medium text-emerald-400">Sodium</span>
                        {recipe.nutrition.sodium}mg
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Instructions</h2>
                  <ol className="space-y-6">
                    {recipe.instructions.map((instruction) => (
                      <li key={instruction.step} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-medium">
                          {instruction.step}
                        </span>
                        <p className="text-gray-400">{instruction.instruction}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}