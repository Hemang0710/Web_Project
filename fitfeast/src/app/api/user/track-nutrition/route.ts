import { NextRequest, NextResponse } from "next/server";
import { getToken } from 'next-auth/jwt';
import { connectToDatabase } from '@/app/lib/db';
import HealthRecord from '@/app/models/HealthRecord';

// POST handler for tracking user nutrition
export async function POST(req: NextRequest) {
  // Not implemented yet
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

// GET - Fetch user's nutrition tracking history
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to view nutrition history' }, { status: 401 });
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build query
    const query: any = { userId: token.sub };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const records = await HealthRecord.find(query)
      .sort({ date: -1 })
      .limit(limit);

    // Calculate current BMI from latest record
    let currentBMI = null;
    let bmiCategory = null;
    if (records.length > 0) {
      const latest = records[0];
      currentBMI = Number((latest.weight / Math.pow(latest.height / 100, 2)).toFixed(1));
      // Use bmiCategory variable instead of getBMICategory
      // bmiCategory = getBMICategory(currentBMI);
      // If you have a function, import and use it. Otherwise, leave as null or implement logic here.
    }

    return NextResponse.json({
      records,
      currentBMI,
      bmiCategory,
      totalRecords: records.length
    });

  } catch (error) {
    console.error('Error fetching nutrition history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nutrition history' },
      { status: 500 }
    );
  }
} 