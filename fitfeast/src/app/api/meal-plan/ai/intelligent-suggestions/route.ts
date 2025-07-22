import { NextRequest, NextResponse } from 'next/server';
import { generateIntelligentMealSuggestions, generateAIWeeklyMealPlan } from '@/app/lib/aiUtils';
import { getToken } from 'next-auth/jwt';
import { connectToDatabase } from '@/app/lib/db';
import User from '@/app/models/User';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to get personalized suggestions' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user data from database
    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { 
      suggestionType = 'meals', // 'meals' or 'weekly-plan'
      additionalPreferences = {} 
    } = body;

    // Combine user preferences from database with additional preferences
    const userData = {
      // From database
      cuisine: user.preferredCuisine?.[0] || 'any',
      dietary: user.dietType || 'balanced',
      allergies: user.allergies || [],
      minDailyBudget: user.minDailyBudget || 5,
      maxDailyBudget: user.maxDailyBudget || 30,
      numberOfPeople: user.numberOfPeople || 1,
      preferredMealTypes: user.preferredMealTypes || ['breakfast', 'lunch', 'dinner'],
      
      // Additional preferences from request
      ...additionalPreferences
    };

    let result;

    if (suggestionType === 'weekly-plan') {
      // Generate complete weekly meal plan
      result = await generateAIWeeklyMealPlan({
        cuisine: userData.cuisine,
        dietary: userData.dietary,
        budget: user.budgetWeekly || 100,
        numberOfPeople: userData.numberOfPeople,
        allergies: userData.allergies,
        cookingSkill: additionalPreferences.cookingSkill,
        availableTime: additionalPreferences.availableTime,
        favoriteIngredients: additionalPreferences.favoriteIngredients,
        healthGoals: additionalPreferences.healthGoals,
        mealVariety: additionalPreferences.mealVariety,
        leftoversPreference: additionalPreferences.leftoversPreference
      });
    } else {
      // Generate meal suggestions
      // Get 10 unique meal suggestions
      result = await generateIntelligentMealSuggestions({ ...userData, numberOfUniqueMeals: 10 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      userPreferences: {
        cuisine: userData.cuisine,
        dietary: userData.dietary,
        allergies: userData.allergies,
        budget: user.budgetWeekly,
        numberOfPeople: userData.numberOfPeople
      },
      source: 'ai-intelligent',
      suggestionType
    });

  } catch (error: unknown) {
    console.error('Intelligent meal suggestions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate intelligent meal suggestions',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to get personalized suggestions' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user data from database
    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const suggestionType = searchParams.get('type') || 'meals';
    const cuisine = searchParams.get('cuisine') || user.preferredCuisine?.[0] || 'any';
    const dietary = searchParams.get('dietary') || user.dietType || 'balanced';

    // Create user data object
    const userData = {
      cuisine,
      dietary,
      allergies: user.allergies || [],
      minDailyBudget: user.minDailyBudget || 5,
      maxDailyBudget: user.maxDailyBudget || 30,
      numberOfPeople: user.numberOfPeople || 1,
      preferredMealTypes: user.preferredMealTypes || ['breakfast', 'lunch', 'dinner']
    };

    let result;

    if (suggestionType === 'weekly-plan') {
      result = await generateAIWeeklyMealPlan({
        cuisine: userData.cuisine,
        dietary: userData.dietary,
        budget: user.budgetWeekly || 100,
        numberOfPeople: userData.numberOfPeople,
        allergies: userData.allergies
      });
    } else {
    
      result = await generateIntelligentMealSuggestions({ ...userData, numberOfUniqueMeals: 10 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      userPreferences: userData,
      source: 'ai-intelligent',
      suggestionType
    });

  } catch (error: unknown) {
    console.error('Intelligent meal suggestions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate intelligent meal suggestions',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 