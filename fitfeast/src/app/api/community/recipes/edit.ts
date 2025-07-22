import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import CommunityRecipe from '@/app/models/CommunityRecipe';

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const { recipeId, userId, title, description, ingredients, steps, photoUrl }: {
      recipeId: string;
      userId: string;
      title?: string;
      description?: string;
      ingredients?: string[];
      steps?: string[];
      photoUrl?: string;
    } = await request.json();
    if (!recipeId || !userId) return NextResponse.json({ error: 'Missing recipeId or userId' }, { status: 400 });
    const recipe = await CommunityRecipe.findById(recipeId);
    if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    if (recipe.userId.toString() !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    if (title) recipe.title = title;
    if (description) recipe.description = description;
    if (ingredients) recipe.ingredients = ingredients;
    if (steps) recipe.steps = steps;
    if (photoUrl) recipe.photoUrl = photoUrl;
    await recipe.save();
    return NextResponse.json(recipe);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 