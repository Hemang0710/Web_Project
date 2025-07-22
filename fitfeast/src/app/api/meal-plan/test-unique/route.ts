import { NextRequest, NextResponse } from 'next/server';
import { generateIntelligentMealSuggestions } from '@/app/lib/aiUtils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const count = parseInt(searchParams.get('count') || '10', 10);
    const cuisine = searchParams.get('cuisine') || 'any';
    const dietary = searchParams.get('dietary') || 'balanced';
    
    if (count < 1 || count > 20) {
      return NextResponse.json({ 
        error: 'Count must be between 1 and 20' 
      }, { status: 400 });
    }
    
    // Generate exactly the requested number of unique meals
    const result = await generateIntelligentMealSuggestions({
      cuisine,
      dietary,
      numberOfUniqueMeals: count
    });
    
    return NextResponse.json({
      success: true,
      requestedCount: count,
      actualCount: result.length,
      data: result
    });
    
  } catch (error: any) {
    console.error('Test unique meal generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate unique meal suggestions',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
