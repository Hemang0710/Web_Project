import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Activity from '@/app/models/Activity';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const activities = await Activity.find({ userId: token.id || token.sub })
    .sort({ createdAt: -1 })
    .limit(10);
  return NextResponse.json({ activities });
} 