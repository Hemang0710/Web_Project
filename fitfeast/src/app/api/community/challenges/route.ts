import { NextResponse, NextRequest } from "next/server";
import { getToken } from 'next-auth/jwt';
import { connectToDatabase } from '@/app/lib/db';
import { Challenge } from '@/app/models/Community';

// Feature 7: Community Challenge System
export async function GET() {
  try {
    await connectToDatabase();
    
    const challenges = await Challenge.find({ isActive: true })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// POST - Join a challenge
export async function POST(req: NextRequest) {
  try {
    // Debug: log all cookies
    const token = await getToken({ req }) as { sub?: string } | null;
    console.log('TOKEN:', token); 
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to join challenges' }, { status: 401 });
    }

    const { challengeId } = await req.json();

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (!challenge.isActive) {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 });
    }

    // Check if user is already participating
    const existingParticipant = challenge.participants.find(
      (p: { userId: { toString: () => string } }) => p.userId.toString() === token.sub
    );

    if (existingParticipant) {
      return NextResponse.json({ error: 'Already participating in this challenge' }, { status: 400 });
    }

    // Check if challenge is full
    if (challenge.participants.length >= challenge.maxParticipants) {
      return NextResponse.json({ error: 'Challenge is full' }, { status: 400 });
    }

    // Add user to challenge
    challenge.participants.push({
      userId: token.sub,
      joinedAt: new Date(),
      progress: 0,
      lastUpdate: new Date()
    });

    await challenge.save();

    return NextResponse.json({
      success: true,
      message: 'Successfully joined challenge',
      challenge
    });

  } catch (error) {
    console.error('Error joining challenge:', error);
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    );
  }
}

// PUT - Update challenge progress
export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to update progress' }, { status: 401 });
    }

    const { challengeId, progress } = await req.json();

    if (!challengeId || progress === undefined) {
      return NextResponse.json({ error: 'Challenge ID and progress are required' }, { status: 400 });
    }

    await connectToDatabase();

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Find user's participation
    const participantIndex = challenge.participants.findIndex(
      (p: { userId: { toString: () => string } }) => p.userId.toString() === token.sub
    );

    if (participantIndex === -1) {
      return NextResponse.json({ error: 'Not participating in this challenge' }, { status: 400 });
    }

    // Update progress
    challenge.participants[participantIndex].progress = progress;
    challenge.participants[participantIndex].lastUpdate = new Date();

    await challenge.save();

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      updatedProgress: progress
    });

  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// DELETE - Leave a challenge
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to leave challenges' }, { status: 401 });
    }

    const url = new URL(req.url);
    const challengeId = url.searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Remove user from challenge
    challenge.participants = challenge.participants.filter(
      (p: { userId: { toString: () => string } }) => p.userId.toString() !== token.sub
    );

    await challenge.save();

    return NextResponse.json({
      success: true,
      message: 'Successfully left challenge'
    });

  } catch (error) {
    console.error('Error leaving challenge:', error);
    return NextResponse.json(
      { error: 'Failed to leave challenge' },
      { status: 500 }
    );
  }
} 