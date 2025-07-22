import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import CommunityRecipe from '@/app/models/CommunityRecipe';

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { recipeId, commentId, userId }: {
      recipeId: string;
      commentId: string;
      userId: string;
    } = await request.json();
    if (!recipeId || !commentId || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const recipe = await CommunityRecipe.findById(recipeId);
    if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    const comment = recipe.comments.id(commentId);
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    if (comment.userId.toString() !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    comment.remove();
    await recipe.save();
    return NextResponse.json({ comments: recipe.comments });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 