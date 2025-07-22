import { NextRequest, NextResponse } from "next/server";
import { GroceryPricingService } from "@/app/lib/groceryPricingService";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/app/lib/db";
import GroceryList from "@/app/models/GroceryList";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export async function POST(req: NextRequest) {
  try {
    const { ingredients } = await req.json();
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 });
    }
    const pricingService = new GroceryPricingService();
    const aggregated = pricingService.aggregateIngredients(ingredients.map((i: Ingredient) => i.name));
    const groceryList = Object.values(aggregated).map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      estimatedCostUSD: item.estimatedCostUSD,
      estimatedCostLocal: item.estimatedCostLocal,
      localCurrency: item.localCurrency,
      category: pricingService.findBestMatch(item.name)?.category || 'Other'
    }));
    const totalCost = groceryList.reduce((sum, i) => sum + (i.estimatedCostLocal || 0), 0);
    return NextResponse.json({ groceryList, totalCost });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ 
      error: err.message || 'Failed to generate grocery list',
      groceryList: [],
      totalCost: 0
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to view grocery lists' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const mealPlanId = searchParams.get('mealPlanId');
    const active = searchParams.get('active') === 'true';

    const query: Record<string, unknown> = { userId: token.sub };
    if (mealPlanId) {
      query.mealPlanId = mealPlanId;
    }
    if (active) {
      query.isCompleted = false;
    }

    const groceryLists = await GroceryList.find(query)
      .populate('mealPlanId', 'title startDate endDate')
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({ groceryLists });

  } catch (error) {
    console.error('Error fetching grocery lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grocery lists' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to update grocery lists' }, { status: 401 });
    }

    await connectToDatabase();

    const data = await req.json();
    const { groceryListId, itemUpdates } = data;

    if (!groceryListId || !itemUpdates) {
      return NextResponse.json({ error: 'Grocery list ID and item updates are required' }, { status: 400 });
    }

    const groceryList = await GroceryList.findOne({ _id: groceryListId, userId: token.sub });
    if (!groceryList) {
      return NextResponse.json({ error: 'Grocery list not found' }, { status: 404 });
    }

    // Update items
    itemUpdates.forEach((update: { itemId: string; isPurchased: boolean; actualCost?: number }) => {
      const item = groceryList.items.id(update.itemId);
      if (item) {
        item.isPurchased = update.isPurchased;
        if (update.actualCost !== undefined) {
          item.actualCost = update.actualCost;
        }
      }
    });

    await groceryList.save();

    return NextResponse.json({
      success: true,
      groceryList: {
        id: groceryList._id,
        title: groceryList.title,
        totalEstimatedCost: groceryList.totalEstimatedCost,
        totalActualCost: groceryList.totalActualCost,
        isCompleted: groceryList.isCompleted,
        items: groceryList.items
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update grocery list';
    console.error('Error updating grocery list:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 