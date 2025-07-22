import { MISTRAL_API_KEY, MISTRAL_BASE_URL } from './config';
import connectDB from '@/app/lib/mongodb';

// Mistral AI API client
async function callMistralAPI(prompt: string, maxTokens: number = 1000) {
  const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest', // Using the free tier model
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Gemini API client
async function callGeminiAPI(prompt: string, maxTokens: number = 2048) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
      topP: 0.95,
      topK: 40
    }
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  // Gemini returns candidates[0].content.parts[0].text
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// DeepSeek API client
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1'; // Replace with actual DeepSeek endpoint if different

async function callDeepSeekAPI(prompt: string, maxTokens: number = 1000) {
  if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API key not set');
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat', // or 'deepseek-chat-v3-0324' if required
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function estimatePriceAI(ingredient: string, region: string, year: number): Promise<number | null> {
  const prompt = `What is the average price of 1kg of ${ingredient} in ${region} in ${year}? Give only the number in USD.`;
  
  try {
    const content = await callMistralAPI(prompt, 10);
    const price = parseFloat(content.replace(/[^0-9.]/g, ""));
    return isNaN(price) ? null : price;
  } catch (error) {
    console.error('Error calling Mistral AI for price estimation:', error);
    return null;
  }
}

export async function generateRecipeAI(
cuisine: string,
dietary: string,
budget: number,
mealType?: string,
day?: number
): Promise<Record<string, unknown> | string> {
  const mealContext = mealType ? ` for ${mealType.toLowerCase()}` : '';
  const dayContext = day ? ` (day ${day})` : '';
  const varietyPrompt = mealType && day ? ` Make sure this is different from other ${mealType.toLowerCase()} recipes and suitable for day ${day}.` : '';
  
  const prompt = `Generate a ${dietary} ${cuisine} recipe${mealContext}${dayContext} under $${budget} for 4 servings.${varietyPrompt} Include: name, ingredients (with quantities), step-by-step instructions, and a nutrition estimate (calories, protein, carbs, fat per serving). Respond in JSON format.`;
  
  try {
    const content = await callMistralAPI(prompt, 500);
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  } catch (error) {
    console.error('Error calling Mistral AI for recipe generation:', error);
    // Return a fallback recipe
    return {
      name: `${cuisine} ${mealType || 'Meal'}`,
      ingredients: ['ingredient 1', 'ingredient 2', 'ingredient 3'],
      instructions: ['Step 1', 'Step 2', 'Step 3'],
      nutrition: {
        calories: 400,
        protein: 20,
        carbs: 30,
        fat: 15
      },
      estimated_cost: budget / 4
    };
  }
}

export async function estimateNutritionAI(ingredients: string[]): Promise<Record<string, unknown> | string> {
  const prompt = `Estimate the total calories, protein, carbs, and fat for a recipe with these ingredients: ${ingredients.join(", ")}. Respond in JSON format with keys: calories, protein, carbs, fat.`;
  
  try {
    const content = await callMistralAPI(prompt, 60);
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  } catch (error) {
    console.error('Error calling Mistral AI for nutrition estimation:', error);
    // Return fallback nutrition data
    return {
      calories: 300,
      protein: 15,
      carbs: 25,
      fat: 10
    };
  }
}

// Feature 4: Localized Recipe Fetcher - ZIP to Cuisine mapping
export function getCuisineByZip(zip: string): string {
  const zipToCuisine: Record<string, string> = {
    "10001": "italian",
    "10002": "chinese",
    "10003": "japanese",
    "10004": "american",
    "10005": "french",
    "77001": "tex-mex",
    "77002": "mexican",
    "77003": "vietnamese",
    "77004": "thai",
    "77005": "indian",
    "60601": "soul-food",
    "60602": "american",
    "60603": "italian",
    "60604": "greek",
    "60605": "mediterranean",
    "94112": "mexican",
    "94102": "chinese",
    "94103": "italian",
    "94104": "japanese",
    "94105": "french",
    "30301": "southern",
    "30302": "american",
    "30303": "soul-food",
    "30304": "caribbean",
    "30305": "mediterranean",
    "90001": "mexican",
    "90002": "korean",
    "90003": "thai",
    "90004": "ethiopian",
    "90005": "armenian",
    "33101": "cuban",
    "33102": "caribbean",
    "33103": "latin",
    "33104": "peruvian",
    "33105": "brazilian",
    "98101": "nordic",
    "98102": "scandinavian",
    "98103": "american",
    "98104": "japanese",
    "98105": "korean"
  };
  
  return zipToCuisine[zip] || "american";
}

// Feature 5: Local Price Estimator
export async function estimateGroceryCost(ingredientName: string): Promise<number> {
  // Mock Walmart API data
  const mockPrices: Record<string, number> = {
    "chicken breast": 3.5,
    "rice": 1.0,
    "broccoli": 0.9,
    "tomato": 0.8,
    "onion": 0.6,
    "potato": 0.5,
    "black beans": 1.4,
    "lentils": 1.1,
    "bread": 2.5,
    "milk": 1.6,
    "eggs": 2.1,
    "cheese": 4.0,
    "butter": 3.0,
    "olive oil": 8.0,
    "salt": 0.5,
    "black pepper": 2.0,
    "flour": 1.0,
    "sugar": 0.8,
    "garlic": 0.1,
    "bell pepper": 1.0,
    "carrot": 0.4,
    "spinach": 2.0,
    "lettuce": 1.5,
    "yogurt": 1.0,
    "ground beef": 4.5,
    "salmon": 8.0,
    "shrimp": 6.0,
    "pasta": 1.5,
    "cumin": 3.0,
    "turmeric": 2.5,
    "oregano": 2.0,
    "basil": 2.5,
    "tomato sauce": 1.0,
    "beans": 0.8,
    "tuna": 1.5,
    "orange juice": 4.0,
    "coffee": 8.0,
    "tea": 3.0
  };
  
  // Simulate async API call
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const normalizedName = ingredientName.toLowerCase().trim();
  return mockPrices[normalizedName] || 2.0; // Default fallback price
}

// Feature 6: Weekly Progress Report Generator
export async function generateWeeklyReport(userId: string): Promise<Record<string, unknown>> {
  try {
    await connectDB();
    const HealthRecord = (await import('@/app/models/HealthRecord')).default;
    
    // Get past 7 days of nutrition logs
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const records = await HealthRecord.find({
      userId,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });
    
    if (records.length === 0) {
      return {
        averageCalories: 0,
        averageProtein: 0,
        weightChange: 0,
        bmiChange: 0,
        daysLogged: 0
      };
    }
    
    // Calculate averages
    const totalCalories = records.reduce((sum, record) => sum + (record.nutrition?.calories || 0), 0);
    const totalProtein = records.reduce((sum, record) => sum + (record.nutrition?.protein || 0), 0);
    const averageCalories = Math.round(totalCalories / records.length);
    const averageProtein = Math.round(totalProtein / records.length);
    
    // Calculate weight and BMI changes
    const firstRecord = records[0];
    const lastRecord = records[records.length - 1];
    const weightChange = lastRecord.weight - firstRecord.weight;
    
    const firstBMI = firstRecord.weight / Math.pow(firstRecord.height / 100, 2);
    const lastBMI = lastRecord.weight / Math.pow(lastRecord.height / 100, 2);
    const bmiChange = lastBMI - firstBMI;
    
    return {
      averageCalories,
      averageProtein,
      weightChange: Number(weightChange.toFixed(1)),
      bmiChange: Number(bmiChange.toFixed(1)),
      daysLogged: records.length
    };
  } catch (error) {
    console.error('Error generating weekly report:', error);
    throw new Error('Failed to generate weekly report');
  }
}

// Fetch a recipe from Edamam API
export async function fetchEdamamRecipe({ cuisine, mealType, dietary }: { cuisine: string, mealType: string, dietary?: string }) {
  const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
  const EDAMAM_API_KEY = process.env.EDAMAM_API_KEY;
  if (!EDAMAM_APP_ID || !EDAMAM_API_KEY) {
    throw new Error('Edamam API credentials missing');
  }
  let url = `https://api.edamam.com/search?q=${encodeURIComponent(mealType)}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_API_KEY}&to=20`;
  if (cuisine) url += `&cuisineType=${encodeURIComponent(cuisine)}`;
  if (dietary) url += `&diet=${encodeURIComponent(dietary)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch from Edamam');
  const data = await res.json();
  if (!data.hits || !Array.isArray(data.hits) || data.hits.length === 0) {
    throw new Error('No recipes found from Edamam');
  }
  // Pick a random recipe for variety
  const recipeObj = data.hits[Math.floor(Math.random() * data.hits.length)].recipe;
  return {
    name: recipeObj.label,
    image: recipeObj.image,
    ingredients: recipeObj.ingredientLines,
    instructions: recipeObj.url ? ["See instructions at: " + recipeObj.url] : [],
    nutrition: {
      calories: Math.round(recipeObj.calories / (recipeObj.yield || 1)),
      protein: recipeObj.totalNutrients.PROCNT ? Math.round(recipeObj.totalNutrients.PROCNT.quantity / (recipeObj.yield || 1)) : 0,
      carbs: recipeObj.totalNutrients.CHOCDF ? Math.round(recipeObj.totalNutrients.CHOCDF.quantity / (recipeObj.yield || 1)) : 0,
      fat: recipeObj.totalNutrients.FAT ? Math.round(recipeObj.totalNutrients.FAT.quantity / (recipeObj.yield || 1)) : 0,
    },
    estimated_cost: 3.5 // Placeholder, can be improved
  };
} 

// Feature 7: AI-Powered Recipe Search
export async function searchRecipesWithAI(
  searchQuery: string,
  filters: {
  cuisine?: string;
  dietType?: string;
  maxCalories?: number;
  maxCost?: number;
  difficulty?: string;
  ingredients?: string[];
  }
): Promise<Record<string, unknown>[]> {
  const filterContext = [];
  
  if (filters.cuisine) filterContext.push(`${filters.cuisine} cuisine`);
  if (filters.dietType) filterContext.push(`${filters.dietType} diet`);
  if (filters.maxCalories) filterContext.push(`under ${filters.maxCalories} calories`);
  if (filters.maxCost) filterContext.push(`under $${filters.maxCost}`);
  if (filters.difficulty) filterContext.push(`${filters.difficulty} difficulty`);
  if (filters.ingredients && filters.ingredients.length > 0) {
    filterContext.push(`using ingredients: ${filters.ingredients.join(', ')}`);
  }

  const filterString = filterContext.length > 0 ? ` with these requirements: ${filterContext.join(', ')}` : '';
  
  const prompt = `Search for recipes matching: "${searchQuery}"${filterString}. 
  
  Return a JSON array of 5-10 recipes with this exact structure:
  [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "cuisine": "cuisine type",
      "dietType": "diet type",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": ["step 1", "step 2"],
      "nutrition": {
        "calories": 400,
        "protein": 20,
        "carbs": 30,
        "fats": 15
      },
      "prepTime": 20,
      "cookTime": 30,
      "difficulty": "Easy/Medium/Hard",
      "estimatedCost": 15.50,
      "image": "https://source.unsplash.com/400x400/?recipe-name"
    }
  ]
  
  Make sure the recipes are realistic, budget-friendly, and match the search criteria.`;

  try {
    const content = await callMistralAPI(prompt, 1000);
    
    // Try to parse JSON response
    try {
      const recipes = JSON.parse(content);
      if (Array.isArray(recipes)) {
        return recipes.map(recipe => ({
          ...recipe,
          source: 'ai-generated',
          _id: `ai-${Math.random().toString(36).substr(2, 9)}`
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
    }
    
    // If JSON parsing fails, return a fallback recipe
    return [{
      name: `AI Generated Recipe for "${searchQuery}"`,
      description: `A recipe generated based on your search: ${searchQuery}`,
      cuisine: filters.cuisine || 'international',
      dietType: filters.dietType || 'balanced',
      ingredients: ['ingredient 1', 'ingredient 2', 'ingredient 3'],
      instructions: ['Step 1: Prepare ingredients', 'Step 2: Cook according to preference', 'Step 3: Serve and enjoy'],
      nutrition: {
        calories: filters.maxCalories || 400,
        protein: 20,
        carbs: 30,
        fats: 15
      },
      prepTime: 20,
      cookTime: 30,
      difficulty: filters.difficulty || 'Medium',
      estimatedCost: filters.maxCost || 15.00,
      image: `https://source.unsplash.com/400x400/?${encodeURIComponent(searchQuery)}`,
      source: 'ai-generated',
      _id: `ai-${Math.random().toString(36).substr(2, 9)}`
    }];
    
  } catch (error) {
    console.error('Error calling Mistral AI for recipe search:', error);
    return [];
  }
}

// Feature 8: AI Recipe Recommendations
export async function getAIRecipeRecommendations(userPreferences: {
  favoriteCuisines?: string[];
  dietaryRestrictions?: string[];
  budget?: number;
  cookingSkill?: string;
  favoriteIngredients?: string[];
}): Promise<Record<string, unknown>[]> {
  const preferences = [];
  
  if (userPreferences.favoriteCuisines) {
    preferences.push(`favorite cuisines: ${userPreferences.favoriteCuisines.join(', ')}`);
  }
  if (userPreferences.dietaryRestrictions) {
    preferences.push(`dietary restrictions: ${userPreferences.dietaryRestrictions.join(', ')}`);
  }
  if (userPreferences.budget) {
    preferences.push(`budget: $${userPreferences.budget}`);
  }
  if (userPreferences.cookingSkill) {
    preferences.push(`cooking skill: ${userPreferences.cookingSkill}`);
  }
  if (userPreferences.favoriteIngredients) {
    preferences.push(`favorite ingredients: ${userPreferences.favoriteIngredients.join(', ')}`);
  }

  const prompt = `Based on these user preferences: ${preferences.join(', ')}, recommend 5 personalized recipes that would be perfect for this user.
  
  Return a JSON array with this structure:
  [
    {
      "name": "Recipe Name",
      "description": "Why this recipe is perfect for the user",
      "cuisine": "cuisine type",
      "dietType": "diet type",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": ["step 1", "step 2"],
      "nutrition": {
        "calories": 400,
        "protein": 20,
        "carbs": 30,
        "fats": 15
      },
      "prepTime": 20,
      "cookTime": 30,
      "difficulty": "Easy/Medium/Hard",
      "estimatedCost": 15.50,
      "image": "https://source.unsplash.com/400x400/?recipe-name",
      "whyRecommended": "Explanation of why this recipe matches the user's preferences"
    }
  ]`;

  try {
    const content = await callMistralAPI(prompt, 1200);
    
    try {
      const recipes = JSON.parse(content);
      if (Array.isArray(recipes)) {
        return recipes.map(recipe => ({
          ...recipe,
          source: 'ai-recommendation',
          _id: `ai-rec-${Math.random().toString(36).substr(2, 9)}`
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse AI recommendations as JSON:', parseError);
    }
    
    return [];
    
  } catch (error) {
    console.error('Error calling Mistral AI for recipe recommendations:', error);
    return [];
  }
} 

// Feature 9: AI-Powered Meal Suggestions Based on User Data
export async function generateIntelligentMealSuggestions(userData: {
  cuisine?: string;
  dietary?: string;
  allergies?: string[];
  minDailyBudget?: number;
  maxDailyBudget?: number;
  numberOfPeople?: number;
  preferredMealTypes?: string[];
  cookingSkill?: string;
  availableTime?: string;
  favoriteIngredients?: string[];
  dislikedIngredients?: string[];
  healthGoals?: string[];
  seasonalPreferences?: string;
  occasion?: string;
  numberOfUniqueMeals?: number;
}): Promise<Record<string, unknown>[]> {
  const context = [];
  
  // Build context from user data
  if (userData.cuisine && userData.cuisine !== 'any') {
    context.push(`${userData.cuisine} cuisine`);
  }
  if (userData.dietary) {
    context.push(`${userData.dietary} diet`);
  }
  if (userData.allergies && userData.allergies.length > 0) {
    context.push(`allergies: ${userData.allergies.join(', ')}`);
  }
  if (userData.minDailyBudget && userData.maxDailyBudget) {
    context.push(`budget: $${userData.minDailyBudget}-${userData.maxDailyBudget} per day`);
  }
  if (userData.numberOfPeople) {
    context.push(`serving ${userData.numberOfPeople} people`);
  }
  if (userData.cookingSkill) {
    context.push(`${userData.cookingSkill} cooking skill level`);
  }
  if (userData.availableTime) {
    context.push(`${userData.availableTime} available cooking time`);
  }
  if (userData.favoriteIngredients && userData.favoriteIngredients.length > 0) {
    context.push(`favorite ingredients: ${userData.favoriteIngredients.join(', ')}`);
  }
  if (userData.dislikedIngredients && userData.dislikedIngredients.length > 0) {
    context.push(`avoid: ${userData.dislikedIngredients.join(', ')}`);
  }
  if (userData.healthGoals && userData.healthGoals.length > 0) {
    context.push(`health goals: ${userData.healthGoals.join(', ')}`);
  }
  if (userData.seasonalPreferences) {
    context.push(`seasonal preference: ${userData.seasonalPreferences}`);
  }
  if (userData.occasion) {
    context.push(`occasion: ${userData.occasion}`);
  }

  const contextString = context.length > 0 ? ` with these requirements: ${context.join(', ')}` : '';
  
  // If numberOfUniqueMeals is specified, use that number, otherwise default to 21
  const numberOfMeals = userData.numberOfUniqueMeals || 21;
  const prompt = `Generate exactly ${numberOfMeals} UNIQUE intelligent meal suggestions${contextString}.
  
  Carefully follow these instructions:
  - Respond ONLY with a valid JSON array, no explanations, no comments, no extra text.
  - If you cannot provide valid JSON, respond with an empty array [] and nothing else.
  - Each meal object MUST have:
    - "name" (string, recipe name)
    - "image" (string, image URL)
    - "ingredients" (array of objects: { name, quantity, unit, calories, protein, carbs, fat })
    - "instructions" (array of strings)
    - "nutrition" (object: { calories, protein, carbs, fat })
    - "description" (string)
    - "type" (string: breakfast/lunch/dinner/snack)
    - "cuisine" (string)
    - "dietary" (string)
    - "prepTime" (number, minutes)
    - "cookTime" (number, minutes)
    - "difficulty" (string)
    - "estimatedCost" (number)
    - "whyRecommended" (string)
    - "healthBenefits" (string)
    - "budgetFriendly" (string)
    - "timeEfficient" (string)
  - Make sure each meal is unique and different from the others (different types, cuisines, and ingredients where possible).
  - Do NOT include any explanation, comments, or extra text. Only output the JSON array.
  
  Example:
  [
    {
      "name": "Chickpea Curry",
      "image": "https://source.unsplash.com/400x400/?chickpea-curry",
      "ingredients": [
        { "name": "Chickpeas", "quantity": 200, "unit": "g", "calories": 300, "protein": 15, "carbs": 45, "fat": 5 },
        { "name": "Tomato", "quantity": 100, "unit": "g", "calories": 20, "protein": 1, "carbs": 4, "fat": 0 }
      ],
      "instructions": [
        "Soak chickpeas overnight.",
        "Cook chickpeas with tomato and spices."
      ],
      "nutrition": { "calories": 350, "protein": 16, "carbs": 49, "fat": 5 },
      "description": "A protein-rich vegetarian meal.",
      "type": "dinner",
      "cuisine": "indian",
      "dietary": "vegetarian",
      "prepTime": 20,
      "cookTime": 30,
      "difficulty": "Easy",
      "estimatedCost": 5.50,
      "whyRecommended": "Rich in protein and fits your dietary needs.",
      "healthBenefits": "Supports muscle gain and heart health.",
      "budgetFriendly": "Costs less than $6 per serving.",
      "timeEfficient": "Ready in under an hour."
    }
  ]
  
  Make sure each meal is unique, realistic, and truly personalized to the user's data.`;

  try {
    const content = await callMistralAPI(prompt, 2000);
    console.log('Raw AI meal suggestion response:', content);
    // Try to parse JSON response
    try {
      let meals;
      try {
        meals = JSON.parse(content);
      } catch (jsonErr) {
        // Try to extract the first JSON array from the response
        const match = content.match(/\[([\s\S]*)\]/);
        if (match) {
          let jsonStr = match[1]; // Extract the content between brackets
          try {
            meals = JSON.parse(jsonStr);
          } catch (arrayErr) {
            // Attempt to fix missing commas between objects in the array
            jsonStr = jsonStr.replace(/\}(\s*)\{/g, '},{');
            try {
              meals = JSON.parse(jsonStr);
            } catch (finalErr) {
              // Try to recover as many valid objects as possible from a partial array
              const partialMeals = [];
              const objRegex = /\{[^\{\}]*\}/g;
              let matchObj;
              while ((matchObj = objRegex.exec(jsonStr)) !== null) {
                try {
                  partialMeals.push(JSON.parse(matchObj[0]));
                } catch (e) {
                  // skip invalid objects
                }
              }
              if (partialMeals.length > 0) {
                // Add a user-friendly message to the first card if partial results
                partialMeals[0].description = (partialMeals[0].description || '') + ' (Partial results: some meals may be missing due to AI response limits.)';
                meals = partialMeals;
              } else {
                console.error('Failed to fix and parse AI meal suggestions as JSON:', finalErr);
                throw finalErr;
              }
            }
          }
        } else {
          throw jsonErr;
        }
      }
      if (Array.isArray(meals)) {
        // Defensive: filter out arrays of ingredients (objects with 'quantity' and 'unit' but no 'ingredients' array)
        if (
          meals.length > 0 &&
          !('ingredients' in meals[0]) &&
          'name' in meals[0] &&
          'quantity' in meals[0]
        ) {
          // Looks like an array of ingredients, not recipes
          return [];
        }
        // Filter out duplicate or near-duplicate meals by name (case-insensitive)
        const uniqueMealsMap = new Map();
        for (const meal of meals) {
          if (!meal.name) continue;
          const key = meal.name.trim().toLowerCase();
          if (!uniqueMealsMap.has(key)) {
            uniqueMealsMap.set(key, meal);
          }
        }
        let uniqueMeals = Array.from(uniqueMealsMap.values());
        // Filter by dietary type if specified
        const dietaryType = userData.dietary || 'balanced';
        if (dietaryType) {
          uniqueMeals = uniqueMeals.filter(m => m.dietary && m.dietary.toLowerCase() === dietaryType.toLowerCase());
        }
        // Get the requested number of unique meals
        const requestedMealCount = userData.numberOfUniqueMeals || 21;
        
        // If we don't have enough unique meals, fill with fallback meals matching dietary
        if (uniqueMeals.length < requestedMealCount) {
          const fallbackMeals = [];
          const mealTypes = ['breakfast', 'lunch', 'dinner'];
          for (let i = 0; i < requestedMealCount; i++) {
            const type = mealTypes[i % mealTypes.length];
            fallbackMeals.push({
              name: `${userData.cuisine || 'Balanced'} ${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
              image: `https://source.unsplash.com/400x400/?${type},${userData.cuisine || 'healthy'}`,
              ingredients: [
                { name: `ingredient ${i * 3 + 1}`, quantity: 100, unit: 'g', calories: 100, protein: 5, carbs: 20, fat: 2 },
                { name: `ingredient ${i * 3 + 2}`, quantity: 50, unit: 'g', calories: 50, protein: 2, carbs: 10, fat: 1 },
                { name: `ingredient ${i * 3 + 3}`, quantity: 30, unit: 'g', calories: 30, protein: 1, carbs: 5, fat: 0.5 }
              ],
              instructions: ['Step 1', 'Step 2', 'Step 3'],
              nutrition: { calories: 180, protein: 8, carbs: 35, fat: 3.5 },
              description: `Fallback ${type} meal`,
              type,
              cuisine: userData.cuisine || 'balanced',
              dietary: userData.dietary || 'balanced',
              prepTime: 15,
              cookTime: 20,
              difficulty: 'Easy',
              estimatedCost: 5.00,
              whyRecommended: 'Fallback meal for when AI is unavailable.',
              healthBenefits: 'Balanced nutrition.',
              budgetFriendly: 'Affordable ingredients.',
              timeEfficient: 'Quick to prepare.'
            });
          }
          // Only add fallback meals that are not already present
          for (const fallback of fallbackMeals) {
            if (uniqueMeals.length >= requestedMealCount) break;
            const key = fallback.name.trim().toLowerCase();
            if (!uniqueMealsMap.has(key)) {
              uniqueMeals.push(fallback);
              uniqueMealsMap.set(key, fallback);
            }
          }
        }
        // Use the requested number of unique meals we defined earlier
        uniqueMeals = uniqueMeals.slice(0, requestedMealCount);
        return uniqueMeals.map(meal => ({
          ...meal,
          source: 'ai-personalized',
          _id: `ai-meal-${Math.random().toString(36).substr(2, 9)}`
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse AI meal suggestions as JSON:', parseError);
      // Return a user-friendly error message instead of fallback meals
      return [{
        name: 'Error',
        description: 'Sorry, we could not generate meal suggestions at this time. Please try again later.',
        type: 'error',
        cuisine: '',
        dietary: '',
        ingredients: [],
        instructions: [],
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        prepTime: 0,
        cookTime: 0,
        difficulty: '',
        estimatedCost: 0,
        image: '',
        whyRecommended: '',
        healthBenefits: '',
        budgetFriendly: '',
        timeEfficient: '',
        source: 'ai-error',
        _id: `ai-meal-error-${Math.random().toString(36).substr(2, 9)}`
      }];
    }
    
  } catch (error) {
    console.error('Error calling Mistral AI for meal suggestions:', error);
    return [];
  }
  // FINAL fallback for TypeScript
  return [];
}

// Feature 10: AI Meal Plan Generation Based on User Data
export async function generateAIWeeklyMealPlan(userData: {
  cuisine?: string;
  dietary?: string;
  budget?: number;
  numberOfPeople?: number;
  allergies?: string[];
  cookingSkill?: string;
  availableTime?: string;
  favoriteIngredients?: string[];
  healthGoals?: string[];
  mealVariety?: string;
  leftoversPreference?: string;
}): Promise<Record<string, unknown>> {
  const context = [];
  
  // Build context
  if (userData.cuisine) context.push(`${userData.cuisine} cuisine`);
  if (userData.dietary) context.push(`${userData.dietary} diet`);
  if (userData.budget) context.push(`$${userData.budget} weekly budget`);
  if (userData.numberOfPeople) context.push(`${userData.numberOfPeople} people`);
  if (userData.allergies && userData.allergies.length > 0) {
    context.push(`allergies: ${userData.allergies.join(', ')}`);
  }
  if (userData.cookingSkill) context.push(`${userData.cookingSkill} cooking skill`);
  if (userData.availableTime) context.push(`${userData.availableTime} available time`);
  if (userData.favoriteIngredients && userData.favoriteIngredients.length > 0) {
    context.push(`favorite ingredients: ${userData.favoriteIngredients.join(', ')}`);
  }
  if (userData.healthGoals && userData.healthGoals.length > 0) {
    context.push(`health goals: ${userData.healthGoals.join(', ')}`);
  }

  const contextString = context.join(', ');
  
  const prompt = `Generate a complete 7-day meal plan for a user with these requirements: ${contextString}.
  
  Create a balanced, varied meal plan that:
  - Includes breakfast, lunch, and dinner for each day
  - Respects all dietary restrictions and allergies
  - Stays within the budget
  - Provides variety throughout the week
  - Considers cooking skill level and available time
  - Incorporates favorite ingredients when possible
  - Supports health goals
  - Minimizes food waste
  
  Return a JSON object with this structure:
  {
    "weeklySummary": {
      "totalCost": 85.50,
      "totalCalories": 12000,
      "averageDailyCalories": 1714,
      "cuisine": "cuisine type",
      "dietType": "diet type",
      "healthBenefits": "Overall health benefits of this meal plan"
    },
    "days": [
      {
        "day": 1,
        "dayName": "Monday",
        "meals": [
          {
            "name": "Recipe Name",
            "type": "breakfast/lunch/dinner",
            "description": "Why this meal is perfect for this day",
            "ingredients": ["ingredient 1", "ingredient 2"],
            "instructions": ["step 1", "step 2"],
            "nutrition": {
              "calories": 400,
              "protein": 20,
              "carbs": 30,
              "fat": 15
            },
            "prepTime": 20,
            "cookTime": 30,
            "difficulty": "Easy/Medium/Hard",
            "estimatedCost": 15.50,
            "image": "https://source.unsplash.com/400x400/?recipe-name",
            "daySpecificBenefits": "Why this meal works well for this specific day"
          }
        ],
        "dailySummary": {
          "totalCalories": 1200,
          "totalCost": 25.50,
          "nutritionalBalance": "How well this day's meals balance nutrition"
        }
      }
    ]
  }`;

  try {
    const content = await callMistralAPI(prompt, 2000);
    // Try to extract JSON object from the response, even if there's extra text
    let mealPlan;
    try {
      // Try direct parse first
      mealPlan = JSON.parse(content);
    } catch (jsonErr) {
      // Try to extract the first JSON object from the response
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        let jsonStr = match[0];
        try {
          mealPlan = JSON.parse(jsonStr);
        } catch (finalErr) {
          // If still fails, fallback
          console.error('Failed to fix and parse AI meal plan as JSON:', finalErr);
        }
      } else {
        console.error('No JSON object found in AI meal plan response:', jsonErr);
      }
    }
    if (mealPlan && mealPlan.weeklySummary && mealPlan.days) {
      return {
        ...mealPlan,
        source: 'ai-generated-plan',
        generatedAt: new Date().toISOString()
      };
    }
    // If parsing fails, fallback below
  } catch (error) {
    console.error('Error calling Mistral AI for meal plan generation:', error);
  }
  // Fallback meal plan: 7 days, each with unique breakfast, lunch, dinner
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const fallbackMealsByDay = Array.from({ length: 7 }, (_, dayIdx) => {
    const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIdx];
    return mealTypes.map((type, typeIdx) => ({
      name: `${userData.cuisine || 'Balanced'} ${type.charAt(0).toUpperCase() + type.slice(1)} ${dayName}`,
      type,
      description: `A unique ${type} for ${dayName}`,
      ingredients: [
        { name: `ingredient ${dayIdx * 3 + typeIdx * 3 + 1}`, quantity: 100, unit: 'g', calories: 100, protein: 5, carbs: 20, fat: 2 },
        { name: `ingredient ${dayIdx * 3 + typeIdx * 3 + 2}`, quantity: 50, unit: 'g', calories: 50, protein: 2, carbs: 10, fat: 1 },
        { name: `ingredient ${dayIdx * 3 + typeIdx * 3 + 3}`, quantity: 30, unit: 'g', calories: 30, protein: 1, carbs: 5, fat: 0.5 }
      ],
      instructions: ['Step 1', 'Step 2', 'Step 3'],
      nutrition: { calories: 180 + typeIdx * 100, protein: 8 + typeIdx * 5, carbs: 35 + typeIdx * 10, fat: 3.5 + typeIdx * 2 },
      prepTime: 15 + typeIdx * 5,
      cookTime: 20 + typeIdx * 5,
      difficulty: 'Easy',
      estimatedCost: 5.00 + typeIdx * 2,
      image: `https://source.unsplash.com/400x400/?${type},${userData.cuisine || 'healthy'},${dayName}`,
      daySpecificBenefits: `Perfect ${type} for ${dayName}`
    }));
  });
  return {
    weeklySummary: {
      totalCost: userData.budget || 100,
      totalCalories: 12000,
      averageDailyCalories: 1714,
      cuisine: userData.cuisine || 'balanced',
      dietType: userData.dietary || 'balanced',
      healthBenefits: 'Balanced nutrition throughout the week'
    },
    days: Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
      meals: fallbackMealsByDay[i],
      dailySummary: {
        totalCalories: 1700,
        totalCost: (userData.budget || 100) / 7,
        nutritionalBalance: 'Well-balanced daily nutrition'
      }
    })),
    source: 'ai-generated-plan',
    generatedAt: new Date().toISOString()
  };
} 