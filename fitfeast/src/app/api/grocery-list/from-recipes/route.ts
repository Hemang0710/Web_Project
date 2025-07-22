import { NextRequest, NextResponse } from "next/server";
import { GroceryPricingService } from "@/app/lib/groceryPricingService";

// Type for a recipe object
interface Recipe {
  name: string;
  ingredients: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { recipes } = await req.json();
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: 'No recipes provided' }, { status: 400 });
    }
    // Flatten all ingredients from all recipes
    const ingredients = recipes.flatMap((recipe: Recipe) => recipe.ingredients);
    if (ingredients.length === 0) {
      return NextResponse.json({ 
        error: 'No ingredients found in recipes',
        groceryList: [],
        totalCost: 0
      });
    }
    const pricingService = new GroceryPricingService();
    const aggregated = pricingService.aggregateIngredients(ingredients);
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