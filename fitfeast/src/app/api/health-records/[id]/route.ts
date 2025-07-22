import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import HealthRecord from '@/app/models/HealthRecord';
import connectDB from '@/app/lib/mongodb';

// GET handler for fetching a health record by ID
export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid health record ID' }, { status: 400 });
    }

    const healthRecord = await HealthRecord.findById(id);
    if (!healthRecord) {
      return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
    }

    return NextResponse.json(healthRecord);
  } catch (error) {
    console.error('Error fetching health record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health record' },
      { status: 500 }
    );
  }
}

// PUT handler for updating a health record by ID
export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid health record ID' }, { status: 400 });
    }

    const data = await req.json();
    const updatedHealthRecord = await HealthRecord.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updatedHealthRecord) {
      return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
    }

    return NextResponse.json(updatedHealthRecord);
  } catch (error) {
    console.error('Error updating health record:', error);
    return NextResponse.json(
      { error: 'Failed to update health record' },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a health record by ID
export async function DELETE(
  _req: Request,
  context: { params: { id: string } }
) {
  try {
    // Ensure database connection
    await connectDB();
    console.log('Database connection established');
    
    const { id } = context.params;
    console.log('Attempting to delete health record with ID:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid MongoDB ID format:', id);
      return NextResponse.json({ error: 'Invalid health record ID' }, { status: 400 });
    }

    // First check if the record exists
    const existingRecord = await HealthRecord.findById(id);
    if (!existingRecord) {
      console.log('Health record not found with ID:', id);
      return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
    }

    // Perform the deletion
    const deletedHealthRecord = await HealthRecord.findByIdAndDelete(id);
    if (!deletedHealthRecord) {
      console.log('Failed to delete health record with ID:', id);
      return NextResponse.json({ error: 'Failed to delete health record' }, { status: 500 });
    }

    console.log('Successfully deleted health record with ID:', id);
    return NextResponse.json({ 
      message: 'Health record deleted successfully',
      deletedRecord: deletedHealthRecord 
    });
  } catch (error: unknown) {
    console.error('Detailed error deleting health record:', {
      error,
      id: context.params.id
    });
    
    // Check for specific MongoDB errors
    if (error instanceof Error) {
      if (error.name === 'MongooseError' || error.name === 'MongoError') {
        return NextResponse.json({
          error: 'Database operation failed',
          details: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        error: 'Failed to delete health record',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      error: 'Failed to delete health record',
      details: 'An unknown error occurred'
    }, { status: 500 });
  }
}
