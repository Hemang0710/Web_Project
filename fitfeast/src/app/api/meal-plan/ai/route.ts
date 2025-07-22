import { NextRequest, NextResponse } from "next/server";
import { generateRecipeAI, getCuisineByZip, fetchEdamamRecipe } from "@/app/lib/aiUtils";

const MEALS_PER_DAY = 3;
const DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    const { budget, zipCode, dietary } = await req.json();

    if (!budget || !zipCode) {
      return NextResponse.json(
        { error: "Budget and ZIP code are required" },
        { status: 400 }
      );
    }

    // Get cuisine type based on ZIP code
    const cuisine = getCuisineByZip(zipCode);

    // Calculate per-meal budget
    const perMealBudget = budget / (DAYS * MEALS_PER_DAY);

    const mealTypes = ["Breakfast", "Lunch", "Dinner"];
    const mealPlan: any[] = [];

    let totalCost = 0;
    let totalCalories = 0;

    for (let day = 1; day <= DAYS; day++) {
      const dayMeals: any[] = [];
      for (let mealIdx = 0; mealIdx < MEALS_PER_DAY; mealIdx++) {
        const mealType = mealTypes[mealIdx];
        let recipe;
        try {
          // Try Edamam first for variety
          recipe = await fetchEdamamRecipe({ cuisine, mealType, dietary });
        } catch (e) {
          // Fallback to AI if Edamam fails
          recipe = await generateRecipeAI(
            cuisine,
            dietary || "balanced",
            perMealBudget,
            mealType,
            day
          );
        }
        // Fallbacks if AI returns string or incomplete data
        const cost = recipe.estimated_cost || recipe.cost || perMealBudget;
        const nutrition = recipe.nutrition || {};
        dayMeals.push({
          name: recipe.name || `${cuisine} ${mealType}`,
          type: mealType,
          image: recipe.image || `https://source.unsplash.com/400x400/?${encodeURIComponent(recipe.name || `${cuisine} ${mealType}`)}`,
          cost,
          nutrition: {
            calories: nutrition.calories || 0,
            protein: nutrition.protein || 0,
            carbs: nutrition.carbs || 0,
            fat: nutrition.fat || 0,
          },
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
        });
        totalCost += cost;
        totalCalories += nutrition.calories || 0;
      }
      mealPlan.push({
        day,
        meals: dayMeals,
      });
    }

    return NextResponse.json({
      weeklySummary: {
        totalCost: +totalCost.toFixed(2),
        totalCalories,
        cuisine,
        zipCode
      },
      days: mealPlan,
    });
  } catch (error: any) {
    console.error('Meal plan generation error:', error);
    return NextResponse.json(
      { error: error?.message || "AI service unavailable. Please try again later." },
      { status: 500 }
    );
  }
} 