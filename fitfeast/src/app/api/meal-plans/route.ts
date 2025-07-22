import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import MealPlan from '@/app/models/MealPlan';
import Recipe from '@/app/models/Recipe';
import { getToken } from 'next-auth/jwt';
import HealthRecord from '@/app/models/HealthRecord';
import User from '@/app/models/User';
import Activity from '@/app/models/Activity';

// Add Recipe interface for type usage
interface RecipeType {
  name: string;
  description: string;
  cuisine: string;
  region: string;
  dietType: string[];
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
    estimatedCost: number;
  }>;
  instructions: Array<{
    step: number;
    instruction: string;
  }>;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  servings: number;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  difficulty: string;
  tags?: string[];
  imageUrl?: string;
  source?: string;
  createdBy?: string;
  rating?: {
    average: number;
    count: number;
  };
  isActive?: boolean;
}

// Type for meal plan day
interface MealPlanDay {
  day: number;
  breakfast: RecipeType | null;
  lunch: RecipeType | null;
  dinner: RecipeType | null;
  totalCalories: number;
  totalCost: number;
}

// Type for meal plan
interface MealPlanType {
  userId: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  startDate: Date;
  endDate: Date;
  meals: MealPlanDay[];
  totalCost: number;
  totalCalories: number;
  isActive: boolean;
}

// Helper to generate a meal plan
async function generateMealPlan(budget: number, location: string, dietType: string[] = []): Promise<MealPlanDay[]> {
  const daysInWeek = 7;
  const mealsPerDay = 3;
  const budgetPerMeal = budget / (daysInWeek * mealsPerDay);

  const mealPlan: MealPlanDay[] = [];
  
  for (let day = 0; day < daysInWeek; day++) {
    const dayMeals: MealPlanDay = {
      day: day + 1,
      breakfast: null,
      lunch: null,
      dinner: null,
      totalCalories: 0,
      totalCost: 0
    };

    // Find recipes for each meal type within budget and dietary restrictions
    const meals: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner'];
    for (const meal of meals) {
      const recipe = await Recipe.findOne({
        estimatedCost: { $lte: budgetPerMeal },
        cuisine: { $regex: location, $options: 'i' },
        ...(dietType.length > 0 && { dietType: { $in: dietType } })
      }).sort({ estimatedCost: 1 });

      if (recipe) {
        (dayMeals as unknown as { [key in 'breakfast' | 'lunch' | 'dinner']: RecipeType | null })[meal] = recipe;
        dayMeals.totalCalories += recipe.nutrition.calories;
        dayMeals.totalCost += recipe.estimatedCost;
      }
    }

    mealPlan.push(dayMeals);
  }

  return mealPlan;
}

// GET - Fetch user's meal plans
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = token.id || token.sub;

    await connectToDatabase();
    const query = { userId };

    const mealPlans = await MealPlan.find(query).sort({ createdAt: -1 });
    return NextResponse.json(mealPlans);
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('Error fetching meal plans:', error);
    } else {
      console.error('Error fetching meal plans:', error);
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// POST - Create a new meal plan
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = token.id || token.sub;

    const body = await request.json();
    const { budget, location, dietType, title, description, selectedMeals, groceryList, totalCost, totalCalories } = body;

    await connectToDatabase();

    // If selectedMeals and groceryList are provided, save as a custom plan
    if (Array.isArray(selectedMeals) && Array.isArray(groceryList)) {
      // Assign days of the week to meals if missing
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      // Replace (meal: any, idx: number) with (meal: Record<string, unknown>, idx: number)
      const mealsWithDays = selectedMeals.map((meal: Record<string, unknown>, idx: number) => {
        if (!('day' in meal)) {
          return { ...meal, day: daysOfWeek[idx % 7] };
        }
        return meal;
      });

      const now = new Date();
      const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Backend fallback: calculate totalCost if not provided or zero
      let computedTotalCost = totalCost;
      if (!computedTotalCost || computedTotalCost === 0) {
        if (Array.isArray(groceryList) && groceryList.length > 0) {
          // Replace (item: any) with (item: { estimatedCostLocal?: number })
          computedTotalCost = groceryList.reduce((sum: number, item: { estimatedCostLocal?: number }) => sum + (item.estimatedCostLocal || 0), 0);
        } else if (Array.isArray(selectedMeals) && selectedMeals.length > 0) {
          // Replace (meal: any) with (meal: { cost?: number })
          computedTotalCost = selectedMeals.reduce((sum: number, meal: { cost?: number }) => sum + (meal.cost || 0), 0);
        } else {
          computedTotalCost = 0;
        }
      }

      const mealPlan = new MealPlan({
        userId: token.id || token.sub,
        title: title || 'Custom Meal Plan',
        description: description || '',
        budget: budget || 0,
        location: location || 'Home',
        startDate: now,
        endDate: oneWeekLater,
        meals: mealsWithDays,
        totalCost: computedTotalCost,
        totalCalories: totalCalories || 0,
        isActive: true
      });
      await mealPlan.save();

      // --- Auto-log nutrition to HealthRecord ---
      // Fetch user for height/weight
      const user = await User.findById(token.id || token.sub);
      if (user && user.height && user.weight) {
        // Group meals by day
        const mealsByDay: Record<string, any[]> = {};
        // Replace (meal: any) with (meal: { day?: string, nutrition?: { calories?: number, protein?: number, carbs?: number, fat?: number, fats?: number }, calories?: number })
        mealsWithDays.forEach((meal: { day?: string, nutrition?: { calories?: number, protein?: number, carbs?: number, fat?: number, fats?: number }, calories?: number }) => {
          const day = meal.day || daysOfWeek[0];
          if (!mealsByDay[day]) mealsByDay[day] = [];
          mealsByDay[day].push(meal);
        });
        // For each day, aggregate nutrition and create/update HealthRecord
        for (const day of Object.keys(mealsByDay)) {
          const meals = mealsByDay[day];
          let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;
          // Replace (meal: any) with (meal: { nutrition?: { calories?: number, protein?: number, carbs?: number, fat?: number, fats?: number }, calories?: number })
          meals.forEach((meal: { nutrition?: { calories?: number, protein?: number, carbs?: number, fat?: number, fats?: number }, calories?: number }) => {
            if (meal.nutrition) {
              totalCalories += meal.nutrition.calories || 0;
              totalProtein += meal.nutrition.protein || 0;
              totalCarbs += meal.nutrition.carbs || 0;
              totalFats += meal.nutrition.fat || meal.nutrition.fats || 0;
            } else if (meal.calories) {
              totalCalories += meal.calories;
            }
          });
          // Use the next 7 days from now for the records
          const dayIdx = daysOfWeek.indexOf(day);
          const recordDate = new Date(now.getTime() + dayIdx * 24 * 60 * 60 * 1000);
          // Upsert HealthRecord for this user and date
          await HealthRecord.findOneAndUpdate(
            { userId: user._id, date: recordDate },
            {
              userId: user._id,
              date: recordDate,
              weight: user.weight,
              height: user.height,
              nutrition: {
                calories: totalCalories,
                protein: totalProtein,
                carbs: totalCarbs,
                fats: totalFats
              },
              source: 'auto'
            },
            { upsert: true, new: true }
          );
        }
      }
      // --- End auto-log nutrition ---

      await Activity.create({
        userId,
        type: 'meal-plan',
        description: 'Completed meal plan',
      });

      return NextResponse.json(mealPlan);
    }

    // Otherwise, use the existing generation logic
    if (!budget || !location) {
      return NextResponse.json(
        { error: 'Budget and location are required' },
        { status: 400 }
      );
    }

    // Generate meal plan
    const meals = await generateMealPlan(budget, location, dietType);

    // Create meal plan document
    const mealPlan = new MealPlan({
      userId: token.id || token.sub,
      title: title || `Meal Plan for ${location}`,
      description: description || `Weekly meal plan with a budget of $${budget}`,
      budget,
      location,
      dietType,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      meals
    });

    await mealPlan.save();

    await Activity.create({
      userId,
      type: 'meal-plan',
      description: 'Completed meal plan',
    });

    return NextResponse.json(mealPlan);
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('Error creating meal plan:', error);
    } else {
      console.error('Error creating meal plan:', error);
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}