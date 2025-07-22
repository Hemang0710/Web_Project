import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/app/lib/mongodb';
import SavedMealPlan from '@/app/models/SavedMealPlan';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = token.id || token.sub;
  const plan = await SavedMealPlan.findOne({ _id: params.id, userId });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Build CSV
  let csv = 'Meal Name,Calories,Protein,Carbs,Fat\n';
  (plan.selectedMeals || []).forEach((meal: any) => {
    csv += `"${meal.name}",${meal.nutrition?.calories ?? ''},${meal.nutrition?.protein ?? ''},${meal.nutrition?.carbs ?? ''},${meal.nutrition?.fat ?? meal.nutrition?.fats ?? ''}\n`;
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=meal-plan-${plan._id}.csv`
    }
  });
} 