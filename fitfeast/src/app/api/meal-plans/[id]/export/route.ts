import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import MealPlan from '@/app/models/MealPlan';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '@/app/lib/config';
import { Parser } from 'json2csv';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Manually extract the token from the cookie header
    const cookieHeader = request.headers.get('cookie');
    let userToken = null;
    if (cookieHeader) {
      const match = cookieHeader.match(/token=([^;]+)/);
      if (match) userToken = match[1];
    }
    let token = null;
    if (userToken) {
      try {
        const { payload } = await jwtVerify(userToken, new TextEncoder().encode(JWT_SECRET));
        token = payload;
      } catch (err) {
        // Invalid token
      }
    }
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const mealPlan = await MealPlan.findOne({ _id: params.id, userId: token.id || token.sub });
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