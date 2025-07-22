import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import CommunityRecipe from '@/app/models/CommunityRecipe';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { recipeId, userId, userName, text }: {
      recipeId: string;
      userId: string;
      userName: string;
      text: string;
    } = await request.json();
    if (!recipeId || !userId || !userName || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const recipe = await CommunityRecipe.findById(recipeId);
    if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    recipe.comments.push({ userId, userName, text });
    await recipe.save();
    return NextResponse.json({ comments: recipe.comments });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 