import connectDB from '@/app/lib/mongodb';
import Activity from '@/app/models/Activity';
import HealthRecord from '@/app/models/HealthRecord';
import SavedMealPlan from '@/app/models/SavedMealPlan';
import User from '@/app/models/User';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Type for a meal in a saved meal plan
interface SavedMeal {
  day?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fats?: number;
  };
  calories?: number;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = token.id || token.sub;
    const body = await request.json();
    const { title, description, selectedMeals, groceryList, totalCost, totalCalories, source = 'local' } = body;
    if (!selectedMeals || !Array.isArray(selectedMeals) || selectedMeals.length === 0) {
      return NextResponse.json({ error: 'No meals selected' }, { status: 400 });
    }
    // Save meal plan
    const savedPlan = await SavedMealPlan.create({
      userId,
      title,
      description,
      selectedMeals,
      groceryList,
      totalCost,
      totalCalories,
      source
    });
    // Log activity for meal plan creation
    await Activity.create({
      userId,
      type: 'meal-plan',
      description: 'Created a new meal plan',
    });
    // Fetch user for height/weight
    const user = await User.findById(userId);
    // Aggregate nutrition per day (assume each meal has a 'day' field or fallback to all in one day)
    const days: Record<string, SavedMeal[]> = {};
    (selectedMeals as SavedMeal[]).forEach((meal) => {
      const day = meal.day || 'Day1';
      if (!days[day]) days[day] = [];
      days[day].push(meal);
    });
    const now = new Date();
    Object.entries(days).forEach(async (entry, idx) => {
      const meals = entry[1];
      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;
      meals.forEach((meal) => {
        if (meal.nutrition) {
          totalCalories += meal.nutrition.calories || 0;
          totalProtein += meal.nutrition.protein || 0;
          totalCarbs += meal.nutrition.carbs || 0;
          totalFats += meal.nutrition.fat || meal.nutrition.fats || 0;
        } else if (meal.calories) {
          totalCalories += meal.calories;
        }
      });
      const recordDate = new Date(now.getTime() + idx * 24 * 60 * 60 * 1000);
      await HealthRecord.findOneAndUpdate(
        { userId, date: recordDate },
        {
          userId,
          date: recordDate,
          weight: user?.weight,
          height: user?.height,
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
    });
    return NextResponse.json({ success: true, savedPlan });
  } catch (error) {
    const err = error as Error;
    console.error('Error saving meal plan:', err);
    return NextResponse.json({ error: err.message || 'Failed to save meal plan' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = token.id || token.sub;
    const plans = await SavedMealPlan.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json({ mealPlans: plans });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 