import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import CommunityRecipe from '@/app/models/CommunityRecipe';

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { recipeId, userId }: { recipeId: string; userId: string } = await request.json();
    if (!recipeId || !userId) return NextResponse.json({ error: 'Missing recipeId or userId' }, { status: 400 });
    const recipe = await CommunityRecipe.findById(recipeId);
    if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    if (recipe.userId.toString() !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    await recipe.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 