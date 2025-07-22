import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/app/lib/mongodb';
import SavedMealPlan from '@/app/models/SavedMealPlan';
import ProgressLog from '@/app/models/ProgressLog';
import User from '@/app/models/User';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = token.id || token.sub;
  const plan = await SavedMealPlan.findOne({ _id: params.id, userId });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(plan);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = token.id || token.sub;
  await SavedMealPlan.findOneAndDelete({ _id: params.id, userId });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = token.id || token.sub;
  const body = await req.json();

  // If marking as completed, sync nutrition to ProgressLog
  if (body.isCompleted) {
    const plan = await SavedMealPlan.findOne({ _id: params.id, userId });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const user = await User.findById(userId);
    if (user && user.height && user.weight) {
      // Aggregate nutrition from all selectedMeals
      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;
      plan.selectedMeals.forEach((meal: any) => {
        if (meal.nutrition) {
          totalCalories += meal.nutrition.calories || 0;
          totalProtein += meal.nutrition.protein || 0;
          totalCarbs += meal.nutrition.carbs || 0;
          totalFats += meal.nutrition.fats || meal.nutrition.fat || 0;
        } else if (meal.calories) {
          totalCalories += meal.calories;
        }
      });
      // Use today as the log date
      const recordDate = new Date();
      recordDate.setHours(0, 0, 0, 0);
      await ProgressLog.findOneAndUpdate(
        { userId, date: recordDate },
        {
          userId,
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
    // Mark the plan as completed
    const updated = await SavedMealPlan.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: { isCompleted: true } },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  }

  // Default: update title/description
  const updated = await SavedMealPlan.findOneAndUpdate(
    { _id: params.id, userId },
    { $set: { title: body.title, description: body.description } },
    { new: true }
  );
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
} 