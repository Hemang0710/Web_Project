import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import CommunityRecipe from '@/app/models/CommunityRecipe';
import User from '@/app/models/User';
import { connectToDatabase } from '@/app/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

// Helper to parse multipart form data
async function parseFormData(request: Request): Promise<Record<string, unknown>> {
  const formData = await request.formData();
  const fields: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    fields[key] = value;
  }
  return fields;
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const fields = await parseFormData(request);
    let userId: string | undefined = typeof fields.userId === 'string' ? fields.userId : undefined;
    let userName: string | undefined = typeof fields.userName === 'string' ? fields.userName : undefined;
    const title: string | undefined = typeof fields.title === 'string' ? fields.title : undefined;
    const description: string | undefined = typeof fields.description === 'string' ? fields.description : undefined;
    const ingredientsRaw = fields.ingredients;
    const stepsRaw = fields.steps;
    let photoUrl = '';

    // Validate required fields
    if (!description || description.trim() === '') {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    // Handle image upload
    if (fields.photo && typeof fields.photo === 'object' && 'arrayBuffer' in fields.photo) {
      const file = fields.photo as File;
      const ext = path.extname(file.name) || '.jpg';
      const fileName = `${uuidv4()}${ext}`;
      const uploadPath = path.join(process.cwd(), 'public', 'uploads', fileName);
      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(uploadPath, Buffer.from(arrayBuffer));
      photoUrl = `/uploads/${fileName}`;
    }

    // If userId is an email, look up the user and use their ObjectId
    if (userId && userId.includes('@')) {
      const userDoc = await User.findOne({ email: userId });
      if (!userDoc) {
        return NextResponse.json({ error: 'User not found for provided email.' }, { status: 400 });
      }
      userId = userDoc._id.toString();
      if (!userName) userName = userDoc.name;
    }

    // Parse ingredients and steps as arrays
    let ingredientsArr: unknown;
    if (typeof ingredientsRaw === 'string') {
      try {
        ingredientsArr = JSON.parse(ingredientsRaw);
      } catch {
        ingredientsArr = [];
      }
    } else {
      ingredientsArr = ingredientsRaw;
    }

    let stepsArr: unknown;
    if (typeof stepsRaw === 'string') {
      try {
        stepsArr = JSON.parse(stepsRaw);
      } catch {
        stepsArr = [];
      }
    } else {
      stepsArr = stepsRaw;
    }

    const recipe = await CommunityRecipe.create({
      userId,
      userName,
      title,
      description,
      photoUrl,
      ingredients: ingredientsArr,
      steps: stepsArr
    });
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error('Error sharing recipe:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const recipes = await CommunityRecipe.find().sort({ createdAt: -1 });
    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching community recipes:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
} 