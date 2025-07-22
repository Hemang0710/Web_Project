import { NextRequest, NextResponse } from "next/server";
import { GroceryPricingService } from "@/app/lib/groceryPricingService";

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
    let message = 'Failed to generate grocery list';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ 
      error: message,
      groceryList: [],
      totalCost: 0
    }, { status: 500 });
  }
}

