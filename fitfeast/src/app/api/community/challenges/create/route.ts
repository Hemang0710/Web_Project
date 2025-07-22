import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import { Challenge } from '@/app/models/Community';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    // Accept all fields needed for a challenge
    const {
      title,
      description,
      type = 'community',
      startDate,
      endDate,
      goal,
      maxParticipants = 100,
      createdBy, // optional
    }: {
      title: string;
      description: string;
      type?: string;
      startDate: string;
      endDate: string;
      goal: string;
      maxParticipants?: number;
      createdBy?: string;
    } = body;
    if (!title || !description || !startDate || !endDate || !goal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const challenge = await Challenge.create({
      title,
      description,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      goal,
      maxParticipants,
      createdBy: createdBy || undefined, // allow undefined for demo
      isActive: true,
      participants: [],
    });
    return NextResponse.json(challenge, { status: 201 });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 