import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectToDatabase } from '@/app/lib/db';
import MealPlan from '@/app/models/MealPlan';
import { ExternalAPIService } from '@/app/lib/externalAPI';

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitamins: string[];
  minerals: string[];
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  image: string;
  cost: number;
  nutrition: Nutrition;
  ingredients: string[];
}

export interface DayPlan {
  day: number;
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
}

const externalAPI = new ExternalAPIService();

async function generateMeal(type: 'breakfast' | 'lunch' | 'dinner', cuisine: string, budget: number): Promise<Meal> {
  try {
    const mealTypes = {
      breakfast: 'breakfast',
      lunch: 'main course lunch',
      dinner: 'main course dinner'
    };

    const searchQuery = `${cuisine} ${mealTypes[type]}`;
    console.log(`Searching for ${searchQuery} with budget $${budget}`);

    const recipes = await externalAPI.searchRecipesSpoonacular(
      searchQuery,
      undefined,
      budget ? budget * 100 : undefined,
      10
    );

    if (!recipes || recipes.length === 0) {
      throw new Error(`No ${type} recipes found for ${cuisine} cuisine within $${budget} budget`);
    }

    const recipe = recipes[Math.floor(Math.random() * recipes.length)];
    const nutritionData = await externalAPI.getNutritionSpoonacular(recipe.ingredients);

    if (!nutritionData) {
      console.warn(`No nutrition data found for recipe: ${recipe.name}`);
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: recipe.name,
      type,
      image: recipe.image || `https://source.unsplash.com/400x400/?${encodeURIComponent(recipe.name.toLowerCase())}`,
      cost: recipe.pricePerServing || (nutritionData?.calories || 0) / 100,
      nutrition: {
        calories: nutritionData?.calories || 0,
        protein: nutritionData?.protein || 0,
        carbs: nutritionData?.carbs || 0,
        fat: nutritionData?.fats || 0,
        fiber: nutritionData?.fiber || 0,
        vitamins: ['A', 'C', 'D', 'E'],
        minerals: ['Iron', 'Calcium', 'Magnesium']
      },
      ingredients: recipe.ingredients
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error generating ${type} meal:`, error);
    throw new Error(`Failed to generate ${type} meal: ${errorMessage}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const cuisine = searchParams.get('q');
    const budgetParam = searchParams.get('budget');

    if (!cuisine || cuisine.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a valid cuisine type' }, { status: 400 });
    }

    if (!budgetParam || budgetParam.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a valid weekly budget' }, { status: 400 });
    }

    const budget = parseFloat(budgetParam);
    if (isNaN(budget) || budget <= 0 || budget > 10000) {
      return NextResponse.json({ 
        error: 'Weekly budget must be between $1 and $10,000' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const dailyBudget = budget / 7;
    const mealBudget = dailyBudget / 3;

    console.log(`Generating meal plan for ${cuisine} cuisine with $${budget} weekly budget ($${mealBudget.toFixed(2)} per meal)`);

    const weeklyPlan: DayPlan[] = [];
    
    for (let i = 0; i < 7; i++) {
      try {
        const [breakfast, lunch, dinner] = await Promise.all([
          generateMeal('breakfast', cuisine, mealBudget),
          generateMeal('lunch', cuisine, mealBudget),
          generateMeal('dinner', cuisine, mealBudget)
        ]);

        weeklyPlan.push({
          day: i + 1,
          breakfast: [breakfast],
          lunch: [lunch],
          dinner: [dinner]
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Failed to generate meals for day ${i + 1}:`, error);
        throw new Error(`Unable to find enough recipes for ${cuisine} cuisine within $${budget} weekly budget. Please try a different cuisine or increase your budget. Details: ${errorMessage}`);
      }
    }

    if (weeklyPlan.length === 0) {
      throw new Error(`No recipes found for ${cuisine} cuisine within budget. Please try a different cuisine or adjust your budget.`);
    }

    return NextResponse.json(weeklyPlan);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate meal plan';
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: errorMessage || 'Failed to generate meal plan. Please try a different cuisine or adjust your budget.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to save meal plans' }, { status: 401 });
    }

    const data = await req.json();
    const { meal } = data;

    if (!meal) {
      return NextResponse.json({ error: 'Meal data is required' }, { status: 400 });
    }

    const requiredFields = ['name', 'type', 'ingredients', 'nutrition', 'cost'];
    const missingFields = requiredFields.filter(field => !meal[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const requiredNutrition = ['calories', 'protein', 'carbs', 'fat'];
    const missingNutrition = requiredNutrition.filter(field => !meal.nutrition[field]);

    if (missingNutrition.length > 0) {
      return NextResponse.json(
        { error: `Missing required nutrition fields: ${missingNutrition.join(', ')}` },
        { status: 400 }
      );
    }

    if (!['breakfast', 'lunch', 'dinner'].includes(meal.type)) {
      return NextResponse.json(
        { error: 'Invalid meal type. Must be breakfast, lunch, or dinner' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const mealPlan = new MealPlan({
      userId: token.sub,
      title: `${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)} Plan`,
      description: `${meal.name} meal plan`,
      budget: meal.cost,
      location: meal.cuisine || 'Not specified',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      meals: [{
        day: 'Monday',
        [meal.type]: meal
      }]
    });

    await mealPlan.save();
    return NextResponse.json({ message: 'Meal plan saved successfully', mealPlan });
  } catch (error: any) {
    console.error('Error saving meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to save meal plan. Please try again.' },
      { status: 500 }
    );
  }
}

