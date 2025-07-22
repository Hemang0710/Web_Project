import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import CommunityRecipe from '@/app/models/CommunityRecipe';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { recipeId, userId } = await request.json();
    if (!recipeId || !userId) return NextResponse.json({ error: 'Missing recipeId or userId' }, { status: 400 });
    const recipe = await CommunityRecipe.findById(recipeId);
    if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    const liked = recipe.likes.includes(userId);
    if (liked) {
      recipe.likes.pull(userId);
    } else {
      recipe.likes.push(userId);
    }
    await recipe.save();
    return NextResponse.json({ likes: recipe.likes.length, liked: !liked });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 