import { NextRequest, NextResponse } from "next/server";
import { GroceryPricingService } from "@/app/lib/groceryPricingService";

// Type for a meal object
interface Meal {
  name: string;
  ingredients?: string[];
  ingredientLines?: string[];
}

// Helper to flatten and normalize ingredient lines from meals
function extractIngredientsFromMeals(meals: Meal[]): string[] {
  // Support both Edamam and AI/other formats
  const ingredients = meals.flatMap((meal) => {
    return meal.ingredients || meal.ingredientLines || [];
  });
  return ingredients;
}

export async function POST(req: NextRequest) {
  try {
    const { selectedMeals } = await req.json();
    if (!Array.isArray(selectedMeals) || selectedMeals.length === 0) {
      return NextResponse.json({ error: 'No meals provided' }, { status: 400 });
    }
    const ingredients = extractIngredientsFromMeals(selectedMeals as Meal[]);
    if (ingredients.length === 0) {
      return NextResponse.json({ 
        error: 'No ingredients found in selected meals',
        groceryList: [],
        totalCost: 0
      });
    }
    const pricingService = new GroceryPricingService();
    const aggregated = pricingService.aggregateIngredients(ingredients);
    // Convert to array and group by category
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