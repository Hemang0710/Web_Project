import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Recipe from '@/app/models/Recipe';
import { ExternalAPIService } from '@/app/lib/externalAPI';
import { searchRecipesWithAI } from '@/app/lib/aiUtils';
import jwt from 'jsonwebtoken';
import { culturalRecipes } from "@/app/lib/culturalRecipes";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const apiService = new ExternalAPIService();

// GET - Search and filter recipes
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const cuisine = url.searchParams.get('cuisine');
    const dietType = url.searchParams.get('dietType');
    const maxCalories = url.searchParams.get('maxCalories');
    const maxCost = url.searchParams.get('maxCost');
    const difficulty = url.searchParams.get('difficulty');
    const maxPrepTime = url.searchParams.get('maxPrepTime');
    const ingredients = url.searchParams.get('ingredients');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '9');
    const skip = (page - 1) * limit;
    const source = url.searchParams.get('source') || 'all'; // 'database', 'external', 'all'

    await connectDB();

    let recipes: any[] = [];

    // Search in database first
    if (source === 'database' || source === 'all') {
      const dbRecipes = await searchDatabaseRecipes({
        query,
        cuisine,
        dietType,
        maxCalories: maxCalories ? parseInt(maxCalories) : undefined,
        maxCost: maxCost ? parseFloat(maxCost) : undefined,
        difficulty,
        maxPrepTime: maxPrepTime ? parseInt(maxPrepTime) : undefined,
        ingredients,
        limit: source === 'database' ? limit : Math.floor(limit / 2)
      }) as any[];

      recipes = [...dbRecipes];
    }

    // Search external APIs if needed
    if ((source === 'external' || source === 'all') && recipes.length < limit) {
      const remainingLimit = limit - recipes.length;
      const externalRecipes = await searchExternalRecipes({
        query,
        dietType,
        maxCalories: maxCalories ? parseInt(maxCalories) : undefined,
        limit: remainingLimit
      }) as any[];

      recipes = [...recipes, ...externalRecipes];
    }

    // Search with Mistral AI if needed and we still need more recipes
    if (recipes.length < limit && query) {
      const remainingLimit = limit - recipes.length;
      try {
        const aiRecipes = await searchRecipesWithAI(query, {
          cuisine: cuisine || undefined,
          dietType: dietType || undefined,
          maxCalories: maxCalories ? parseInt(maxCalories) : undefined,
          maxCost: maxCost ? parseFloat(maxCost) : undefined,
          difficulty: difficulty || undefined,
          ingredients: ingredients ? ingredients.split(',').map(i => i.trim()) : undefined
        });

        // Add AI recipes up to the remaining limit
        const aiRecipesToAdd = aiRecipes.slice(0, remainingLimit);
        recipes = [...recipes, ...aiRecipesToAdd];
      } catch (error) {
        console.error('Error searching with Mistral AI:', error);
        // Continue without AI results if there's an error
      }
    }

    // Apply additional filtering for external recipes
    if (maxCost || difficulty || maxPrepTime || ingredients) {
      recipes = recipes.filter((recipe: any) => {
        if (maxCost && recipe.estimatedCost && recipe.estimatedCost > parseFloat(maxCost)) {
          return false;
        }
        if (difficulty && recipe.difficulty && recipe.difficulty !== difficulty) {
          return false;
        }
        if (maxPrepTime && recipe.prepTime && recipe.prepTime > parseInt(maxPrepTime)) {
          return false;
        }
        if (ingredients) {
          const ingredientList = ingredients.toLowerCase().split(',').map(i => i.trim());
          const recipeIngredients = recipe.ingredients?.map((ing: any) => 
            typeof ing === 'string' ? ing.toLowerCase() : ing.name?.toLowerCase()
          ).join(' ') || '';
          
          const hasIngredients = ingredientList.some(ing => 
            recipeIngredients.includes(ing)
          );
          if (!hasIngredients) return false;
        }
        return true;
      });
    }

    const totalRecipes = recipes.length;
    const paginatedRecipes = recipes.slice(skip, skip + limit);

    return NextResponse.json({
      recipes: paginatedRecipes,
      total: totalRecipes,
      currentPage: page,
      totalPages: Math.ceil(totalRecipes / limit),
      source: source
    });
  } catch (error: any) {
    console.error('Error searching recipes:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST - Add a new recipe to the database
export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                  req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const recipeData = await req.json();

    const {
      name,
      description,
      cuisine,
      region,
      dietType,
      ingredients,
      instructions,
      nutrition,
      servings,
      prepTime,
      cookTime,
      difficulty,
      tags,
      imageUrl
    } = recipeData;

    if (!name || !description || !cuisine || !region || !ingredients || !instructions || !nutrition) {
      return NextResponse.json(
        { message: 'Required fields: name, description, cuisine, region, ingredients, instructions, nutrition' },
        { status: 400 }
      );
    }

    await connectDB();

    const recipe = await Recipe.create({
      name,
      description,
      cuisine,
      region,
      dietType: dietType || [],
      ingredients,
      instructions,
      nutrition,
      servings: servings || 1,
      prepTime: prepTime || 15,
      cookTime: cookTime || 30,
      difficulty: difficulty || 'Medium',
      tags: tags || [],
      imageUrl: imageUrl || '',
      source: 'user-generated',
      createdBy: decoded.id
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error: any) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Helper function to search database recipes
async function searchDatabaseRecipes(params: {
  query: string;
  cuisine?: string | null;
  dietType?: string | null;
  maxCalories?: number;
  maxCost?: number;
  difficulty?: string | null;
  maxPrepTime?: number;
  ingredients?: string | null;
  limit: number;
}) {
  const {
    query,
    cuisine,
    dietType,
    maxCalories,
    maxCost,
    difficulty,
    maxPrepTime,
    ingredients,
    limit
  } = params;

  // Build MongoDB query
  const searchQuery: any = { isActive: true };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Filter by cuisine
  if (cuisine) {
    searchQuery.cuisine = new RegExp(cuisine, 'i');
  }

  // Filter by diet type
  if (dietType) {
    searchQuery.dietType = { $in: [dietType] };
  }

  // Filter by calories
  if (maxCalories) {
    searchQuery['nutrition.calories'] = { $lte: maxCalories };
  }

  // Filter by difficulty
  if (difficulty) {
    searchQuery.difficulty = difficulty;
  }

  // Filter by prep time
  if (maxPrepTime) {
    searchQuery.prepTime = { $lte: maxPrepTime };
  }

  // Filter by ingredients
  if (ingredients) {
    const ingredientList = ingredients.split(',').map(ing => ing.trim());
    searchQuery['ingredients.name'] = { 
      $in: ingredientList.map(ing => new RegExp(ing, 'i'))
    };
  }

  // Filter by cost (calculated from ingredients)
  if (maxCost) {
    // This is a simplified approach - in reality, you'd need to aggregate ingredient costs
    searchQuery['ingredients.estimatedCost'] = { $lte: maxCost };
  }

  const recipes = await Recipe.find(searchQuery)
    .populate('createdBy', 'name')
    .sort(query ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .limit(limit);

  return recipes.map((recipe: any) => ({
    ...recipe.toObject(),
    estimatedCost: recipe.ingredients.reduce((sum: number, ing: any) => sum + (ing.estimatedCost || 0), 0),
    source: 'database'
  }));
}

// Helper function to search external APIs
async function searchExternalRecipes(params: {
  query: string;
  dietType?: string | null;
  maxCalories?: number;
  limit: number;
}) {
  // const { query, dietType, maxCalories, limit } = params;

  // Commented out as searchRecipesEdamam does not exist
  // try {
  //   const externalRecipes = await apiService.searchRecipesEdamam(
  //     query || 'healthy recipe',
  //     dietType || undefined,
  //     maxCalories,
  //     limit
  //   );

  //   return externalRecipes.map((recipe: any) => ({
  //     ...
  //   }));
  // } catch (error) {
  //   console.error('Error fetching external recipes:', error);
  //   return [];
  // }
  return [];
}

// PUT - Update recipe rating
export async function PUT(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                  req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const { recipeId, rating } = await req.json();

    if (!recipeId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Recipe ID and valid rating (1-5) are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    // Update rating (simplified - in reality you'd track individual user ratings)
    const newCount = recipe.rating.count + 1;
    const newAverage = ((recipe.rating.average * recipe.rating.count) + rating) / newCount;

    recipe.rating.average = Number(newAverage.toFixed(1));
    recipe.rating.count = newCount;

    await recipe.save();

    return NextResponse.json({
      message: 'Rating updated successfully',
      rating: recipe.rating
    });
  } catch (error: any) {
    console.error('Error updating recipe rating:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

