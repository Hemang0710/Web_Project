import { NextRequest, NextResponse } from 'next/server';
import { searchRecipesWithAI, getAIRecipeRecommendations } from '@/app/lib/aiUtils';
import { searchSpoonacularRecipes } from '@/app/lib/externalAPI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      searchQuery, 
      filters,
      searchType = 'search'
    } = body;

    if (!searchQuery && searchType === 'search') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    let recipes: Record<string, unknown>[] = [];
    let source = 'spoonacular';
    try {
      if (searchType === 'search') {
        recipes = await searchSpoonacularRecipes({
          query: searchQuery,
          cuisine: filters?.cuisine,
          diet: filters?.dietType,
          includeIngredients: filters?.ingredients?.join(',')
        });
        if (!recipes || recipes.length === 0) {
          source = 'ai-generated';
          recipes = await searchRecipesWithAI(searchQuery, {
            cuisine: filters?.cuisine,
            dietType: filters?.dietType,
            maxCalories: filters?.maxCalories,
            maxCost: filters?.maxCost,
            difficulty: filters?.difficulty,
            ingredients: filters?.ingredients
          });
        }
      } else if (searchType === 'recommendations') {
        source = 'ai-generated';
        recipes = await getAIRecipeRecommendations({
          favoriteCuisines: filters?.favoriteCuisines,
          dietaryRestrictions: filters?.dietaryRestrictions,
          budget: filters?.budget,
          cookingSkill: filters?.cookingSkill,
          favoriteIngredients: filters?.favoriteIngredients
        });
      }
    } catch {
      // If Spoonacular fails, fallback to AI-generated recipes
      source = 'ai-generated';
      recipes = await searchRecipesWithAI(searchQuery, {
        cuisine: filters?.cuisine,
        dietType: filters?.dietType,
        maxCalories: filters?.maxCalories,
        maxCost: filters?.maxCost,
        difficulty: filters?.difficulty,
        ingredients: filters?.ingredients
      });
    }

    return NextResponse.json({
      recipes,
      total: recipes.length,
      source,
      searchType
    });

  } catch (error) {
    // Use type guard for error
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('AI Recipe Search Error:', error);
    } else {
      console.error('AI Recipe Search Error:', error);
    }
    return NextResponse.json(
      { 
        error: 'Failed to search recipes with AI',
        details: message
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const cuisine = searchParams.get('cuisine');
    const dietType = searchParams.get('dietType');
    const maxCalories = searchParams.get('maxCalories');
    const maxCost = searchParams.get('maxCost');
    const difficulty = searchParams.get('difficulty');
    const ingredients = searchParams.get('ingredients');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const recipes = await searchRecipesWithAI(query, {
      cuisine: cuisine || undefined,
      dietType: dietType || undefined,
      maxCalories: maxCalories ? parseInt(maxCalories) : undefined,
      maxCost: maxCost ? parseFloat(maxCost) : undefined,
      difficulty: difficulty || undefined,
      ingredients: ingredients ? ingredients.split(',').map(i => i.trim()) : undefined
    });

    return NextResponse.json({
      recipes,
      total: recipes.length,
      source: 'ai-generated',
      query
    });

  } catch (error) {
    // Use type guard for error
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('AI Recipe Search Error:', error);
    } else {
      console.error('AI Recipe Search Error:', error);
    }
    return NextResponse.json(
      { 
        error: 'Failed to search recipes with AI',
        details: message
      },
      { status: 500 }
    );
  }
} 