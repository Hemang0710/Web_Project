import { NextRequest, NextResponse } from "next/server";

// Type for a health record
interface HealthRecord {
  date: string;
  weight: number;
  height: number;
  bmi?: number;
  notes?: string;
}

// POST handler for creating a new health record
export async function POST(req: NextRequest) {
  try {
    const { date, weight, height, notes } = await req.json();
    if (!date || typeof weight !== 'number' || typeof height !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Calculate BMI
    const bmi = weight / ((height / 100) ** 2);
    const record: HealthRecord = { date, weight, height, bmi, notes };
    // TODO: Save record to database
    return NextResponse.json({ record });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to create health record' }, { status: 500 });
}
}

// GET handler for fetching all health records
export async function GET() {
  try {
    // TODO: Fetch health records from database
    return NextResponse.json({ records: [] });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch health records' }, { status: 500 });
  }
} 