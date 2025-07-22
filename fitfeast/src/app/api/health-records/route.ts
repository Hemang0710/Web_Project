import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import HealthRecord from "@/app/models/HealthRecord";
import { getToken } from 'next-auth/jwt';

// Type for a health record
interface HealthRecordType {
  userId: string;
  date: string;
  weight: number;
  height: number;
  bmi?: number;
  notes?: string;
}

// POST handler for creating a new health record
export async function POST(req: NextRequest) {
  try {
    const { userId, date, weight, height, notes } = await req.json();
    if (!userId || !date || typeof weight !== 'number' || typeof height !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Calculate BMI
    const bmi = weight / ((height / 100) ** 2);
    const record: HealthRecordType = { userId, date, weight, height, bmi, notes };
    // TODO: Save record to database using HealthRecord model
    return NextResponse.json({ record });
  } catch (error) {
    let message = 'Failed to create health record';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET handler for fetching all health records for a user
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to view health records' }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch health records for the authenticated user
    const records = await HealthRecord.find({ userId: token.sub }).sort({ date: -1 });
    return NextResponse.json({ records });
  } catch (error) {
    let message = 'Failed to fetch health records';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

