import { NextRequest, NextResponse } from "next/server";
import { getToken } from 'next-auth/jwt';
import { connectToDatabase } from '@/app/lib/db';
import ProgressLog from '@/app/models/ProgressLog';
import User from '@/app/models/User';

interface ProgressLogRequest {
  date?: string;
  weight?: number;
  meals?: Array<{
    recipeId: string;
    recipeName: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    fiber?: number;
  }>;
  notes?: string;
}

interface ProgressStats {
  currentWeight: number;
  weightChange: number;
  currentBMI: number;
  bmiChange: number;
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFats: number;
  totalDaysTracked: number;
  weightTrend: 'increasing' | 'decreasing' | 'stable';
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to log progress' }, { status: 401 });
    }

    await connectToDatabase();

    const data: ProgressLogRequest = await req.json();
    const { date, weight, meals, notes } = data;

    // Get user for height calculation
    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const logDate = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    // Calculate BMI if weight and height are provided
    let bmi: number | undefined;
    if (weight && user.height) {
      const heightInMeters = user.height / 100;
      bmi = weight / (heightInMeters * heightInMeters);
    }

    // Check if progress log already exists for this date
    let progressLog = await ProgressLog.findOne({
      userId: token.sub,
      date: logDate
    });

    if (progressLog) {
      // Update existing log
      if (weight !== undefined) {
        progressLog.weight = weight;
        progressLog.bmi = bmi;
      }
      if (meals) {
        progressLog.meals = meals;
      }
      if (notes) {
        progressLog.notes = notes;
      }
    } else {
      // Create new log
      progressLog = new ProgressLog({
        userId: token.sub,
        date: logDate,
        weight,
        bmi,
        meals: meals || [],
        notes
      });
    }

    await progressLog.save();

    // Update user's current weight if provided
    if (weight && weight !== user.weight) {
      user.weight = weight;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      progressLog: {
        id: progressLog._id,
        date: progressLog.date,
        weight: progressLog.weight,
        bmi: progressLog.bmi,
        totalCalories: progressLog.totalCalories,
        totalProtein: progressLog.totalProtein,
        totalCarbs: progressLog.totalCarbs,
        totalFats: progressLog.totalFats,
        totalFiber: progressLog.totalFiber,
        meals: progressLog.meals,
        notes: progressLog.notes
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to log progress';
    console.error('Error logging progress:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET handler for fetching enhanced progress data
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to view progress stats' }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch all progress logs for the user
    const progressLogs = await ProgressLog.find({ userId: token.sub }).sort({ date: 1 });
    const stats = await calculateProgressStats(token.sub, progressLogs);

    return NextResponse.json({ stats });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch progress stats';
    console.error('Error fetching progress stats:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function calculateProgressStats(userId: string, progressLogs: any[]): Promise<ProgressStats> {
  const sortedLogs = progressLogs.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const currentWeight = sortedLogs[sortedLogs.length - 1]?.weight || 0;
  const previousWeight = sortedLogs.length > 1 ? sortedLogs[sortedLogs.length - 2]?.weight || currentWeight : currentWeight;
  const weightChange = currentWeight - previousWeight;

  const user = await User.findById(userId);
  const currentBMI = user?.height && currentWeight ? currentWeight / Math.pow(user.height / 100, 2) : 0;
  const previousBMI = user?.height && previousWeight ? previousWeight / Math.pow(user.height / 100, 2) : 0;
  const bmiChange = currentBMI - previousBMI;

  // Calculate averages
  const totalCalories = progressLogs.reduce((sum, log) => sum + (log.totalCalories || 0), 0);
  const totalProtein = progressLogs.reduce((sum, log) => sum + (log.totalProtein || 0), 0);
  const totalCarbs = progressLogs.reduce((sum, log) => sum + (log.totalCarbs || 0), 0);
  const totalFats = progressLogs.reduce((sum, log) => sum + (log.totalFats || 0), 0);

  const averageCalories = progressLogs.length > 0 ? totalCalories / progressLogs.length : 0;
  const averageProtein = progressLogs.length > 0 ? totalProtein / progressLogs.length : 0;
  const averageCarbs = progressLogs.length > 0 ? totalCarbs / progressLogs.length : 0;
  const averageFats = progressLogs.length > 0 ? totalFats / progressLogs.length : 0;

  // Determine weight trend
  let weightTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(weightChange) > 0.5) {
    weightTrend = weightChange > 0 ? 'increasing' : 'decreasing';
  }

  return {
    currentWeight: Number(currentWeight.toFixed(1)),
    weightChange: Number(weightChange.toFixed(1)),
    currentBMI: Number(currentBMI.toFixed(1)),
    bmiChange: Number(bmiChange.toFixed(1)),
    averageCalories: Math.round(averageCalories),
    averageProtein: Number(averageProtein.toFixed(1)),
    averageCarbs: Number(averageCarbs.toFixed(1)),
    averageFats: Number(averageFats.toFixed(1)),
    totalDaysTracked: progressLogs.length,
    weightTrend
  };
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to update progress' }, { status: 401 });
    }

    await connectToDatabase();

    const data = await req.json();
    const { progressLogId, updates } = data;

    if (!progressLogId || !updates) {
      return NextResponse.json({ error: 'Progress log ID and updates are required' }, { status: 400 });
    }

    const progressLog = await ProgressLog.findOne({ _id: progressLogId, userId: token.sub });
    if (!progressLog) {
      return NextResponse.json({ error: 'Progress log not found' }, { status: 404 });
    }

    // Update fields
    Object.assign(progressLog, updates);
    await progressLog.save();

    return NextResponse.json({
      success: true,
      progressLog: {
        id: progressLog._id,
        date: progressLog.date,
        weight: progressLog.weight,
        bmi: progressLog.bmi,
        totalCalories: progressLog.totalCalories,
        meals: progressLog.meals,
        notes: progressLog.notes
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update progress';
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 