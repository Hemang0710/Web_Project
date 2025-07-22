import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import MealPlan from '@/app/models/MealPlan';
import { getToken } from 'next-auth/jwt';
import { Parser } from 'json2csv';
import ProgressLog from '@/app/models/ProgressLog';
import User from '@/app/models/User';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const mealPlan = await MealPlan.findOne({
      _id: params.id,
      userId: token.sub
    });

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    return NextResponse.json(mealPlan);
  } catch (error: any) {
    console.error('Error fetching meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    const mealPlan = await MealPlan.findOneAndUpdate(
      { _id: params.id, userId: token.sub },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // If marking as completed, sync nutrition to ProgressLog
    if (body.isCompleted) {
      const user = await User.findById(token.sub);
      if (user && user.height && user.weight) {
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        for (const dayObj of mealPlan.meals) {
          let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;
          ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
            const meal = dayObj[mealType];
            if (Array.isArray(meal)) {
              meal.forEach(snack => {
                if (snack.nutrition) {
                  totalCalories += snack.nutrition.calories || 0;
                  totalProtein += snack.nutrition.protein || 0;
                  totalCarbs += snack.nutrition.carbs || 0;
                  totalFats += snack.nutrition.fats || 0;
                }
              });
            } else if (meal && meal.nutrition) {
              totalCalories += meal.nutrition.calories || 0;
              totalProtein += meal.nutrition.protein || 0;
              totalCarbs += meal.nutrition.carbs || 0;
              totalFats += meal.nutrition.fats || 0;
            }
          });
          // Calculate the date for this day
          const dayIdx = daysOfWeek.indexOf(dayObj.day);
          const recordDate = new Date(mealPlan.startDate);
          recordDate.setDate(recordDate.getDate() + dayIdx);
          // Upsert ProgressLog
          await ProgressLog.findOneAndUpdate(
            { userId: user._id, date: recordDate },
            {
              userId: user._id,
              date: recordDate,
              weight: user.weight,
              bmi: user.weight / Math.pow(user.height / 100, 2),
              totalCalories,
              totalProtein,
              totalCarbs,
              totalFats,
              meals: [],
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    return NextResponse.json(mealPlan);
  } catch (error: any) {
    console.error('Error updating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to update meal plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const mealPlan = await MealPlan.findOneAndDelete({
      _id: params.id,
      userId: token.sub
    });

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Meal plan deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete meal plan' },
      { status: 500 }
    );
  }
}

// Export meal plan as CSV
export async function GET_export(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const mealPlan = await MealPlan.findOne({ _id: params.id, userId: token.sub });
    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }
    // Flatten meals for CSV
    const rows: any[] = [];
    mealPlan.meals.forEach((day: any) => {
      ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
        const meal = day[mealType];
        if (meal) {
          rows.push({
            day: day.day,
            mealType,
            name: meal.name,
            ingredients: (meal.ingredients || []).join('; '),
            calories: meal.calories,
            cost: meal.cost,
            protein: meal.nutrition?.protein,
            carbs: meal.nutrition?.carbs,
            fats: meal.nutrition?.fats,
            fiber: meal.nutrition?.fiber
          });
        }
      });
      if (day.snacks) {
        day.snacks.forEach((snack: any) => {
          rows.push({
            day: day.day,
            mealType: 'snack',
            name: snack.name,
            ingredients: (snack.ingredients || []).join('; '),
            calories: snack.calories,
            cost: snack.cost,
            protein: snack.nutrition?.protein,
            carbs: snack.nutrition?.carbs,
            fats: snack.nutrition?.fats,
            fiber: snack.nutrition?.fiber
          });
        });
      }
    });
    const parser = new Parser();
    const csv = parser.parse(rows);
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=meal-plan-${params.id}.csv`
      }
    });
  } catch (error: any) {
    console.error('Error exporting meal plan:', error);
    return NextResponse.json({ error: error.message || 'Failed to export meal plan' }, { status: 500 });
  }
}