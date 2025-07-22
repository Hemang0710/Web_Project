import { NextRequest, NextResponse } from "next/server";
import { fetchEdamamRecipe, generateRecipeAI } from "@/app/lib/aiUtils";

// Mock meal data for fallback when API is unavailable
const mockMeals = [
  {
    name: "Grilled Chicken Salad",
    type: "lunch",
    cuisine: "american",
    dietary: "high-protein",
    ingredients: ["chicken breast", "mixed greens", "cherry tomatoes", "cucumber", "olive oil", "balsamic vinegar"],
    instructions: ["Season chicken with salt and pepper", "Grill for 6-8 minutes per side", "Chop vegetables", "Combine and drizzle with dressing"],
    nutrition: { calories: 350, protein: 35, carbs: 8, fat: 18 },
    estimated_cost: 8.50
  },
  {
    name: "Vegetarian Pasta Primavera",
    type: "dinner",
    cuisine: "italian",
    dietary: "vegetarian",
    ingredients: ["whole wheat pasta", "broccoli", "bell peppers", "zucchini", "cherry tomatoes", "parmesan cheese"],
    instructions: ["Cook pasta according to package", "Sauté vegetables", "Combine with pasta", "Top with parmesan"],
    nutrition: { calories: 420, protein: 15, carbs: 65, fat: 12 },
    estimated_cost: 6.75
  },
  {
    name: "Quinoa Buddha Bowl",
    type: "lunch",
    cuisine: "mediterranean",
    dietary: "vegan",
    ingredients: ["quinoa", "chickpeas", "kale", "sweet potato", "avocado", "tahini dressing"],
    instructions: ["Cook quinoa", "Roast sweet potato", "Massage kale", "Assemble bowl", "Drizzle with tahini"],
    nutrition: { calories: 480, protein: 18, carbs: 55, fat: 22 },
    estimated_cost: 7.25
  },
  {
    name: "Salmon with Roasted Vegetables",
    type: "dinner",
    cuisine: "mediterranean",
    dietary: "balanced",
    ingredients: ["salmon fillet", "asparagus", "cherry tomatoes", "lemon", "garlic", "olive oil"],
    instructions: ["Season salmon", "Roast vegetables", "Bake salmon", "Serve with lemon"],
    nutrition: { calories: 520, protein: 42, carbs: 12, fat: 28 },
    estimated_cost: 12.50
  },
  {
    name: "Overnight Oats with Berries",
    type: "breakfast",
    cuisine: "american",
    dietary: "vegetarian",
    ingredients: ["rolled oats", "almond milk", "honey", "mixed berries", "chia seeds", "vanilla extract"],
    instructions: ["Mix oats with milk", "Add honey and vanilla", "Refrigerate overnight", "Top with berries"],
    nutrition: { calories: 320, protein: 12, carbs: 45, fat: 14 },
    estimated_cost: 4.25
  },
  {
    name: "Mexican Street Tacos",
    type: "dinner",
    cuisine: "mexican",
    dietary: "balanced",
    ingredients: ["corn tortillas", "grilled chicken", "onion", "cilantro", "lime", "salsa"],
    instructions: ["Grill chicken", "Warm tortillas", "Chop vegetables", "Assemble tacos"],
    nutrition: { calories: 380, protein: 28, carbs: 35, fat: 16 },
    estimated_cost: 8.75
  },
  {
    name: "Greek Yogurt Parfait",
    type: "breakfast",
    cuisine: "mediterranean",
    dietary: "high-protein",
    ingredients: ["greek yogurt", "granola", "honey", "mixed berries", "almonds"],
    instructions: ["Layer yogurt", "Add granola", "Top with berries", "Drizzle honey"],
    nutrition: { calories: 290, protein: 22, carbs: 28, fat: 12 },
    estimated_cost: 5.50
  },
  {
    name: "Stir-Fried Vegetable Rice",
    type: "lunch",
    cuisine: "chinese",
    dietary: "vegan",
    ingredients: ["brown rice", "broccoli", "carrots", "bell peppers", "soy sauce", "ginger"],
    instructions: ["Cook rice", "Stir-fry vegetables", "Combine with rice", "Season with soy sauce"],
    nutrition: { calories: 340, protein: 8, carbs: 58, fat: 10 },
    estimated_cost: 5.25
  }
];

function extractJsonFromString(str: string): Record<string, unknown> | null {
  // Try to extract JSON from a markdown code block or plain string
  const codeBlockMatch = str.match(/```json([\s\S]*?)```/i);
  let jsonString = codeBlockMatch ? codeBlockMatch[1] : str;
  // Remove any leading text before the first '{'
  const firstBrace = jsonString.indexOf('{');
  if (firstBrace > 0) jsonString = jsonString.slice(firstBrace);
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

// Helper to generate a batch of unique meal suggestions
async function generateMealSuggestions({
  cuisine, dietary, allergies, minBudget, maxBudget, numberOfPeople, mealTypes, count
}: {
  cuisine: string,
  dietary?: string,
  allergies?: string[],
  minBudget?: number,
  maxBudget?: number,
  numberOfPeople?: number,
  mealTypes?: string[],
  count: number
}): Promise<Record<string, unknown>[]> {
  const suggestions: Record<string, unknown>[] = [];
  const usedNames = new Set<string>();
  let attempts = 0;
  let useMockData = false;

  while (suggestions.length < count && attempts < count * 3) {
    attempts++;
    const mealType = mealTypes ? mealTypes[Math.floor(Math.random() * mealTypes.length)] : '';
    let recipe;
    
    try {
      if (!useMockData) {
        recipe = await fetchEdamamRecipe({ cuisine, mealType, dietary });
        // Type guard for ingredients
        if (
          allergies &&
          recipe &&
          typeof recipe === 'object' &&
          'ingredients' in recipe &&
          Array.isArray((recipe as { ingredients: unknown[] }).ingredients) &&
          (recipe as { ingredients: string[] }).ingredients.some((ing: string) =>
            allergies.some(a => ing.toLowerCase().includes(a.toLowerCase()))
          )
        ) {
          continue;
        }
      }
    } catch (error) {
      console.log('Edamam API failed, trying AI fallback...');
      try {
        recipe = await generateRecipeAI(
          cuisine,
          dietary || "balanced",
          maxBudget || 10,
          mealType,
          suggestions.length + 1
        );
        // If recipe is a string, try to extract JSON
        if (typeof recipe === 'string') {
          const parsed = extractJsonFromString(recipe);
          if (parsed && parsed.recipe) {
            recipe = parsed.recipe;
          } else if (parsed) {
            recipe = parsed;
          } else {
            // Parsing failed, fallback to mock data
            useMockData = true;
            continue;
          }
        }
        if (
          allergies &&
          recipe &&
          typeof recipe === 'object' &&
          'ingredients' in recipe &&
          Array.isArray((recipe as { ingredients: unknown[] }).ingredients) &&
          (recipe as { ingredients: string[] }).ingredients.some((ing: string) =>
            allergies.some(a => ing.toLowerCase().includes(a.toLowerCase()))
          )
        ) {
          continue;
        }
      } catch (aiError) {
        console.log('AI API also failed, using mock data...');
        useMockData = true;
      }
    }

    // Use mock data if APIs failed
    if (useMockData) {
      const mockMeal = mockMeals[Math.floor(Math.random() * mockMeals.length)];
      recipe = {
        ...mockMeal,
        name: `${mockMeal.name} ${suggestions.length + 1}`,
        estimated_cost: mockMeal.estimated_cost * (numberOfPeople || 1)
      };
    }

    // Ensure uniqueness by name
    if (
      !recipe ||
      typeof recipe === 'string' ||
      !(typeof recipe === 'object' && 'name' in recipe && typeof (recipe as { name: unknown }).name === 'string') ||
      usedNames.has((recipe as { name: string }).name)
    ) {
      continue;
    }
    usedNames.add((recipe as { name: string }).name);
    // Adjust ingredient quantities for numberOfPeople (if possible)
    (recipe as Record<string, unknown>).servings = numberOfPeople || 1;
    suggestions.push(recipe as Record<string, unknown>);
  }
  
  return suggestions;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cuisine,
      dietary,
      allergies,
      minDailyBudget,
      maxDailyBudget,
      numberOfPeople,
      preferredMealTypes
    } = body;
    
    // Default to 24 suggestions
    const count = 24;
    const suggestions = await generateMealSuggestions({
      cuisine,
      dietary,
      allergies,
      minBudget: minDailyBudget,
      maxBudget: maxDailyBudget,
      numberOfPeople,
      mealTypes: preferredMealTypes,
      count
    });
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Meal suggestions error:', error);
    
    // Return mock data as fallback
    const fallbackSuggestions = mockMeals.slice(0, 8).map((meal, index) => ({
      ...meal,
      name: `${meal.name} ${index + 1}`,
      estimated_cost: meal.estimated_cost * 2
    }));
    
    return NextResponse.json({ 
      suggestions: fallbackSuggestions,
      message: "Using sample meal suggestions (API unavailable)"
    });
  }
} 