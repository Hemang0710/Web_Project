import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import GroceryList from '@/app/models/GroceryList';

// Define segment config
export const dynamic = 'force-dynamic'; 
export const runtime = 'nodejs'; 

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const groceryList = await GroceryList.findById(params.id);
    
    if (!groceryList) {
      return NextResponse.json(
        { error: 'Grocery list not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(groceryList, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error fetching grocery list:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    return NextResponse.json(
      { message: 'Not implemented', id: params.id, body },
      { 
        status: 501,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error updating grocery list:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    return NextResponse.json(
      { message: 'Not implemented', id: params.id }, 
      { 
        status: 501,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error deleting grocery list:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}