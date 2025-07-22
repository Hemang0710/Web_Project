import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectToDatabase } from '@/app/lib/db';
import MealPlan from '@/app/models/MealPlan';
import User from '@/app/models/User';
import { ExternalAPIService } from '@/app/lib/externalAPI';
import { currencyService } from '@/app/lib/currencyService';
import { groceryPricingService } from '@/app/lib/groceryPricingService';

const externalAPI = new ExternalAPIService();

interface MealPlanRequest {
  budget: number;
  currency: string;
  cuisine: string;
  dietType?: string;
  location?: string;
}

interface EnhancedMeal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  image: string;
  costUSD: number;
  costLocal: number;
  localCurrency: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  ingredients: string[];
  cuisine: string;
  dietType: string;
}

interface EnhancedDayPlan {
  day: number;
  dayName: string;
  breakfast: EnhancedMeal[];
  lunch: EnhancedMeal[];
  dinner: EnhancedMeal[];
  totalCostUSD: number;
  totalCostLocal: number;
  totalCalories: number;
}

interface EnhancedWeeklyPlan {
  weekStart: Date;
  weekEnd: Date;
  totalBudgetUSD: number;
  totalBudgetLocal: number;
  localCurrency: string;
  cuisine: string;
  dietType: string;
  days: EnhancedDayPlan[];
  totalCostUSD: number;
  totalCostLocal: number;
  totalCalories: number;
  budgetRemainingUSD: number;
  budgetRemainingLocal: number;
}

async function generateEnhancedMeal(
  type: 'breakfast' | 'lunch' | 'dinner',
  cuisine: string,
  dietType: string,
  budgetUSD: number,
  localCurrency: string
): Promise<EnhancedMeal> {
  try {
    const mealTypes = {
      breakfast: 'breakfast',
      lunch: 'main course lunch',
      dinner: 'main course dinner'
    };

    const searchQuery = `${cuisine} ${mealTypes[type]} ${dietType}`;
    console.log(`Searching for ${searchQuery} with budget $${budgetUSD} USD`);

    const recipes = await externalAPI.searchRecipesSpoonacular(
      searchQuery,
      dietType,
      budgetUSD * 100, // Convert to calories for API
      10
    );

    if (!recipes || recipes.length === 0) {
      throw new Error(`No ${type} recipes found for ${cuisine} cuisine with ${dietType} diet`);
    }

    const recipe = recipes[Math.floor(Math.random() * recipes.length)];
    const nutritionData = await externalAPI.getNutritionSpoonacular(recipe.ingredients);

    const costUSD = recipe.pricePerServing || (nutritionData?.calories || 0) / 100;
    const costLocal = await currencyService.convertUSDToLocal(costUSD, localCurrency);

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: recipe.name,
      type,
      image: recipe.image || `https://source.unsplash.com/400x400/?${encodeURIComponent(recipe.name.toLowerCase())}`,
      costUSD: Number(costUSD.toFixed(2)),
      costLocal: Number(costLocal.toFixed(2)),
      localCurrency,
      nutrition: {
        calories: nutritionData?.calories || 0,
        protein: nutritionData?.protein || 0,
        carbs: nutritionData?.carbs || 0,
        fats: nutritionData?.fats || 0,
        fiber: nutritionData?.fiber || 0
      },
      ingredients: recipe.ingredients,
      cuisine,
      dietType
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error generating ${type} meal:`, error);
    throw new Error(`Failed to generate ${type} meal: ${errorMessage}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to create meal plans' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user preferences
    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data: MealPlanRequest = await req.json();
    const {
      budget,
      currency = user.currency || 'USD',
      cuisine = user.preferredCuisine?.[0] || 'Italian',
      dietType = user.dietType || 'balanced',
      location = user.location || 'United States'
    } = data;

    if (!budget || budget <= 0) {
      return NextResponse.json({ error: 'Valid budget is required' }, { status: 400 });
    }

    // Convert budget to USD for API calls
    const budgetUSD = await currencyService.convertBudgetToUSD(budget, currency);
    const dailyBudgetUSD = budgetUSD / 7;
    const mealBudgetUSD = dailyBudgetUSD / 3;

    console.log(`Generating meal plan for ${cuisine} cuisine with ${currency} ${budget} budget (${budgetUSD.toFixed(2)} USD)`);

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const days: EnhancedDayPlan[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 0; i < 7; i++) {
      try {
        const [breakfast, lunch, dinner] = await Promise.all([
          generateEnhancedMeal('breakfast', cuisine, dietType, mealBudgetUSD, currency),
          generateEnhancedMeal('lunch', cuisine, dietType, mealBudgetUSD, currency),
          generateEnhancedMeal('dinner', cuisine, dietType, mealBudgetUSD, currency)
        ]);

        const dayTotalCostUSD = breakfast.costUSD + lunch.costUSD + dinner.costUSD;
        const dayTotalCostLocal = breakfast.costLocal + lunch.costLocal + dinner.costLocal;
        const dayTotalCalories = breakfast.nutrition.calories + lunch.nutrition.calories + dinner.nutrition.calories;

        days.push({
          day: i + 1,
          dayName: dayNames[weekStart.getDay() + i],
          breakfast: [breakfast],
          lunch: [lunch],
          dinner: [dinner],
          totalCostUSD: Number(dayTotalCostUSD.toFixed(2)),
          totalCostLocal: Number(dayTotalCostLocal.toFixed(2)),
          totalCalories: Math.round(dayTotalCalories)
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Failed to generate meals for day ${i + 1}:`, error);
        throw new Error(`Unable to find enough recipes for ${cuisine} cuisine with ${dietType} diet. Please try different preferences. Details: ${errorMessage}`);
      }
    }

    const totalCostUSD = days.reduce((sum, day) => sum + day.totalCostUSD, 0);
    const totalCostLocal = days.reduce((sum, day) => sum + day.totalCostLocal, 0);
    const totalCalories = days.reduce((sum, day) => sum + day.totalCalories, 0);
    const budgetRemainingUSD = budgetUSD - totalCostUSD;
    const budgetRemainingLocal = budget - totalCostLocal;

    const weeklyPlan: EnhancedWeeklyPlan = {
      weekStart,
      weekEnd,
      totalBudgetUSD: Number(budgetUSD.toFixed(2)),
      totalBudgetLocal: budget,
      localCurrency: currency,
      cuisine,
      dietType,
      days,
      totalCostUSD: Number(totalCostUSD.toFixed(2)),
      totalCostLocal: Number(totalCostLocal.toFixed(2)),
      totalCalories,
      budgetRemainingUSD: Number(budgetRemainingUSD.toFixed(2)),
      budgetRemainingLocal: Number(budgetRemainingLocal.toFixed(2))
    };

    // Save to database
    const mealPlan = new MealPlan({
      userId: token.sub,
      title: `${cuisine} ${dietType} Meal Plan`,
      description: `Weekly meal plan for ${cuisine} cuisine with ${dietType} diet`,
      budget: budgetUSD,
      location,
      startDate: weekStart,
      endDate: weekEnd,
      meals: days.map(day => ({
        day: day.dayName,
        breakfast: day.breakfast[0] ? {
          name: day.breakfast[0].name,
          ingredients: day.breakfast[0].ingredients,
          calories: day.breakfast[0].nutrition.calories,
          cost: day.breakfast[0].costUSD,
          nutrition: day.breakfast[0].nutrition
        } : undefined,
        lunch: day.lunch[0] ? {
          name: day.lunch[0].name,
          ingredients: day.lunch[0].ingredients,
          calories: day.lunch[0].nutrition.calories,
          cost: day.lunch[0].costUSD,
          nutrition: day.lunch[0].nutrition
        } : undefined,
        dinner: day.dinner[0] ? {
          name: day.dinner[0].name,
          ingredients: day.dinner[0].ingredients,
          calories: day.dinner[0].nutrition.calories,
          cost: day.dinner[0].costUSD,
          nutrition: day.dinner[0].nutrition
        } : undefined
      })),
      totalCost: totalCostUSD,
      totalCalories,
      isActive: true
    });

    await mealPlan.save();

    return NextResponse.json({
      success: true,
      mealPlan: weeklyPlan,
      savedMealPlanId: mealPlan._id
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate meal plan';
    console.error('Error generating enhanced meal plan:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to view meal plans' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const active = searchParams.get('active') === 'true';

    const query: Record<string, unknown> = { userId: token.sub };
    if (active) {
      query.isActive = true;
    }

    const mealPlans = await MealPlan.find(query)
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({ mealPlans });

  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    );
  }
} 