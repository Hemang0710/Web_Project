import { NextRequest, NextResponse } from "next/server";
import { getToken } from 'next-auth/jwt';
import { connectToDatabase } from '@/app/lib/db';
import User from '@/app/models/User';
import { currencyService } from '@/app/lib/currencyService';

// Define UserPreferences interface if not imported
interface UserPreferences {
  currency: string;
  location: string;
  budgetWeekly: number;
  preferredCuisine: string[];
  dietType: string;
  height?: number;
  weight?: number;
  allergies?: string[];
  numberOfPeople?: number;
  minDailyBudget?: number;
  maxDailyBudget?: number;
  preferredMealTypes?: string[];
}

// GET handler for fetching user preferences
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to view preferences' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preferences: UserPreferences = {
      currency: user.currency,
      location: user.location,
      budgetWeekly: user.budgetWeekly,
      preferredCuisine: user.preferredCuisine,
      dietType: user.dietType,
      height: user.height,
      weight: user.weight,
      allergies: user.allergies,
      numberOfPeople: user.numberOfPeople,
      minDailyBudget: user.minDailyBudget,
      maxDailyBudget: user.maxDailyBudget,
      preferredMealTypes: user.preferredMealTypes
    };

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch preferences';
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT handler for updating user preferences
export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to update preferences' }, { status: 401 });
    }

    await connectToDatabase();

    const data: UserPreferences = await req.json();
    const {
      currency,
      location,
      budgetWeekly,
      preferredCuisine,
      dietType,
      height,
      weight,
      allergies,
      numberOfPeople,
      minDailyBudget,
      maxDailyBudget,
      preferredMealTypes
    } = data;

    // Validate required fields
    if (!currency || !location || !budgetWeekly || !preferredCuisine || !dietType) {
      return NextResponse.json({ 
        error: 'All preference fields are required: currency, location, budgetWeekly, preferredCuisine, dietType' 
      }, { status: 400 });
    }

    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate currency
    if (!currencyService.getSupportedCurrencies().includes(currency)) {
      return NextResponse.json({ 
        error: `Unsupported currency. Supported currencies: ${currencyService.getSupportedCurrencies().join(', ')}` 
      }, { status: 400 });
    }

    // Validate budget
    if (budgetWeekly < 10 || budgetWeekly > 10000) {
      return NextResponse.json({ 
        error: 'Weekly budget must be between $10 and $10,000' 
      }, { status: 400 });
    }

    // Validate height
    if (height && (height < 100 || height > 250)) {
      return NextResponse.json({ 
        error: 'Height must be between 100cm and 250cm' 
      }, { status: 400 });
    }

    // Validate weight
    if (weight && (weight < 30 || weight > 300)) {
      return NextResponse.json({ 
        error: 'Weight must be between 30kg and 300kg' 
      }, { status: 400 });
    }

    // Update user preferences
    user.currency = currency;
    user.location = location;
    user.budgetWeekly = budgetWeekly;
    user.preferredCuisine = preferredCuisine;
    user.dietType = dietType;
    if (height) user.height = height;
    if (weight) user.weight = weight;
    if (allergies) user.allergies = allergies;
    if (numberOfPeople) user.numberOfPeople = numberOfPeople;
    if (minDailyBudget) user.minDailyBudget = minDailyBudget;
    if (maxDailyBudget) user.maxDailyBudget = maxDailyBudget;
    if (preferredMealTypes) user.preferredMealTypes = preferredMealTypes;

    await user.save();

    const preferences: UserPreferences = {
      currency: user.currency,
      location: user.location,
      budgetWeekly: user.budgetWeekly,
      preferredCuisine: user.preferredCuisine,
      dietType: user.dietType,
      height: user.height,
      weight: user.weight,
      allergies: user.allergies,
      numberOfPeople: user.numberOfPeople,
      minDailyBudget: user.minDailyBudget,
      maxDailyBudget: user.maxDailyBudget,
      preferredMealTypes: user.preferredMealTypes
    };

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update preferences';
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to set preferences' }, { status: 401 });
    }

    await connectToDatabase();

    const data: UserPreferences = await req.json();
    const {
      currency,
      location,
      budgetWeekly,
      preferredCuisine,
      dietType,
      height,
      weight,
      allergies,
      numberOfPeople,
      minDailyBudget,
      maxDailyBudget,
      preferredMealTypes
    } = data;

    // Validate required fields
    if (!currency || !location || !budgetWeekly || !preferredCuisine || !dietType) {
      return NextResponse.json({ 
        error: 'All preference fields are required: currency, location, budgetWeekly, preferredCuisine, dietType' 
      }, { status: 400 });
    }

    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate currency
    if (!currencyService.getSupportedCurrencies().includes(currency)) {
      return NextResponse.json({ 
        error: `Unsupported currency. Supported currencies: ${currencyService.getSupportedCurrencies().join(', ')}` 
      }, { status: 400 });
    }

    // Validate budget
    if (budgetWeekly < 10 || budgetWeekly > 10000) {
      return NextResponse.json({ 
        error: 'Weekly budget must be between $10 and $10,000' 
      }, { status: 400 });
    }

    // Validate height
    if (height && (height < 100 || height > 250)) {
      return NextResponse.json({ 
        error: 'Height must be between 100cm and 250cm' 
      }, { status: 400 });
    }

    // Validate weight
    if (weight && (weight < 30 || weight > 300)) {
      return NextResponse.json({ 
        error: 'Weight must be between 30kg and 300kg' 
      }, { status: 400 });
    }

    // Update user preferences
    user.currency = currency;
    user.location = location;
    user.budgetWeekly = budgetWeekly;
    user.preferredCuisine = preferredCuisine;
    user.dietType = dietType;
    if (height) user.height = height;
    if (weight) user.weight = weight;
    if (allergies) user.allergies = allergies;
    if (numberOfPeople) user.numberOfPeople = numberOfPeople;
    if (minDailyBudget) user.minDailyBudget = minDailyBudget;
    if (maxDailyBudget) user.maxDailyBudget = maxDailyBudget;
    if (preferredMealTypes) user.preferredMealTypes = preferredMealTypes;

    await user.save();

    const preferences: UserPreferences = {
      currency: user.currency,
      location: user.location,
      budgetWeekly: user.budgetWeekly,
      preferredCuisine: user.preferredCuisine,
      dietType: user.dietType,
      height: user.height,
      weight: user.weight,
      allergies: user.allergies,
      numberOfPeople: user.numberOfPeople,
      minDailyBudget: user.minDailyBudget,
      maxDailyBudget: user.maxDailyBudget,
      preferredMealTypes: user.preferredMealTypes
    };

    return NextResponse.json({
      success: true,
      preferences
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to set preferences';
    console.error('Error setting user preferences:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 