interface ApiError extends Error {
  status?: number;
  code?: string;
  response?: Response;
}

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface FoodItem {
  name: string;
  nutrition: NutritionData;
  servingSize: string;
  category: string;
}

interface RecipeData {
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrition: NutritionData;
  servings: number;
  prepTime: number;
  cookTime: number;
  pricePerServing?: number;
  image?: string;
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  image: string;
  summary?: string;
  dishTypes?: string[];
  cuisines?: string[];
  diets?: string[];
  preparationMinutes?: number;
  cookingMinutes?: number;
  nutrition: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  extendedIngredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  analyzedInstructions: Array<{
    steps: Array<{
      number: number;
      step: string;
    }>;
  }>;
  pricePerServing: number;
}

import axios from 'axios';

function mapSpoonacularRecipe(recipe: SpoonacularRecipe): Record<string, unknown> {
  return {
    name: recipe.title,
    image: recipe.image,
    ingredients: recipe.extendedIngredients
      ? recipe.extendedIngredients.map((ing: { name: string; amount: number; unit: string; original?: string }) =>
          'original' in ing ? ing.original : `${ing.amount} ${ing.unit} ${ing.name}`
        )
      : [],
    instructions: recipe.analyzedInstructions && recipe.analyzedInstructions[0] && recipe.analyzedInstructions[0].steps
      ? recipe.analyzedInstructions[0].steps.map((step: { step: string }) => step.step)
      : [],
    nutrition: {
      calories: getNutrient(recipe.nutrition, 'Calories'),
      protein: getNutrient(recipe.nutrition, 'Protein'),
      carbs: getNutrient(recipe.nutrition, 'Carbohydrates'),
      fat: getNutrient(recipe.nutrition, 'Fat'),
    },
    description: recipe.summary ? recipe.summary.replace(/<[^>]+>/g, '') : '',
    type: recipe.dishTypes && recipe.dishTypes.length > 0 ? recipe.dishTypes[0] : '',
    cuisine: recipe.cuisines && recipe.cuisines.length > 0 ? recipe.cuisines[0] : '',
    dietary: recipe.diets && recipe.diets.length > 0 ? recipe.diets[0] : '',
    prepTime: recipe.preparationMinutes || 0,
    cookTime: recipe.cookingMinutes || 0,
    difficulty: '',
    estimatedCost: recipe.pricePerServing ? (recipe.pricePerServing / 100).toFixed(2) : '',
    whyRecommended: '',
    healthBenefits: '',
    budgetFriendly: '',
    timeEfficient: '',
    source: 'spoonacular',
    _id: `spoonacular-${recipe.id}`
  };
}

function getNutrient(nutrition: SpoonacularRecipe['nutrition'], name: string): number | string {
  const nutrient = nutrition?.nutrients?.find((n) => n.name === name);
  return nutrient ? nutrient.amount : '--';
}

export async function searchSpoonacularRecipes({ query, cuisine, diet, includeIngredients, number = 10 }: {
  query?: string;
  cuisine?: string;
  diet?: string;
  includeIngredients?: string;
  number?: number;
}): Promise<Record<string, unknown>[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  const url = 'https://api.spoonacular.com/recipes/complexSearch';
  const params = {
    apiKey,
    query,
    cuisine,
    diet,
    includeIngredients,
    number,
    addRecipeNutrition: true,
    addRecipeInformation: true,
  };
  try {
    const response = await axios.get(url, { params });
    const recipes = response.data.results || [];
    return recipes.map(mapSpoonacularRecipe);
  } catch (error: any) {
    console.error('Spoonacular API error:', error.response?.data || error.message);
    throw error;
  }
}

export async function getSpoonacularRecipeNutrition(recipeId: number | string): Promise<Record<string, unknown>> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  const url = `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json`;
  try {
    const response = await axios.get(url, { params: { apiKey } });
    return response.data;
  } catch (error: any) {
    console.error('Spoonacular Nutrition API error:', error.response?.data || error.message);
    throw error;
  }
}

export async function getSpoonacularIngredientPrice(ingredientId: number | string): Promise<Record<string, unknown>> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  const url = `https://api.spoonacular.com/food/ingredients/${ingredientId}/information`;
  try {
    const response = await axios.get(url, { params: { apiKey, amount: 1 } });
    return response.data.estimatedCost;
  } catch (error: any) {
    console.error('Spoonacular Ingredient Price API error:', error.response?.data || error.message);
    throw error;
  }
}

export class ExternalAPIService {
  private readonly spoonacularApiKey: string;
  private readonly usdaApiKey: string;
  private readonly nutritionixAppId: string;
  private readonly nutritionixAppKey: string;
  private readonly useMockData: {
    spoonacular: boolean;
    usda: boolean;
    nutritionix: boolean;
  };

  constructor() {
    const spoonacularApiKey = process.env.SPOONACULAR_API_KEY;
    const usdaApiKey = process.env.USDA_API_KEY;
    const nutritionixAppId = process.env.NUTRITIONIX_APP_ID;
    const nutritionixAppKey = process.env.NUTRITIONIX_APP_KEY;

    this.spoonacularApiKey = spoonacularApiKey || '';
    this.usdaApiKey = usdaApiKey || '';
    this.nutritionixAppId = nutritionixAppId || '';
    this.nutritionixAppKey = nutritionixAppKey || '';

    this.useMockData = {
      spoonacular: !spoonacularApiKey,
      usda: !usdaApiKey,
      nutritionix: !nutritionixAppId || !nutritionixAppKey
    };

    if (this.useMockData.spoonacular) {
      console.warn('Spoonacular API key not found, using mock data');
    }
  }

  private async validateApiResponse(response: Response, apiName: string): Promise<void> {
    if (!response.ok) {
      const status = response.status;
      let errorMessage = `${apiName} API error: ${response.statusText}`;
      
      switch (status) {
        case 401:
          errorMessage = `${apiName} API authentication failed. Please check your API credentials.`;
          break;
        case 403:
          errorMessage = `${apiName} API access forbidden. Please check your API permissions.`;
          break;
        case 429:
          errorMessage = `${apiName} API rate limit exceeded. Please try again later.`;
          break;
        case 500:
          errorMessage = `${apiName} API server error. Please try again later.`;
          break;
        default:
          errorMessage = `${apiName} API error (${status}): ${response.statusText}`;
      }
      
      const error = new Error(errorMessage) as ApiError;
      error.status = status;
      throw error;
    }
  }

  private validateRecipeData(recipe: SpoonacularRecipe): boolean {
    return !!recipe.title &&
           !!recipe.servings &&
           !!recipe.readyInMinutes &&
           Array.isArray(recipe.extendedIngredients) &&
           recipe.extendedIngredients.length > 0 &&
           Array.isArray(recipe.analyzedInstructions) &&
           recipe.analyzedInstructions.length > 0 &&
           Array.isArray(recipe.analyzedInstructions[0]?.steps);
  }

  public async searchRecipesSpoonacular(query: string, dietType?: string, maxCalories?: number, limit: number = 10): Promise<RecipeData[]> {
    if (!this.spoonacularApiKey) {
      console.warn('Spoonacular API key not found');
      return this.getMockRecipeData();
    }
    if (this.useMockData.spoonacular) {
      console.log('Using mock data for Spoonacular recipe search');
      return this.getMockRecipeData();
    }

    try {
      const url = new URL('https://api.spoonacular.com/recipes/complexSearch');
      url.searchParams.append('apiKey', this.spoonacularApiKey);
      url.searchParams.append('query', query.trim());
      url.searchParams.append('number', limit.toString());
      url.searchParams.append('addRecipeNutrition', 'true');
      url.searchParams.append('addRecipeInformation', 'true');
      url.searchParams.append('fillIngredients', 'true');
      
      if (dietType) {
        url.searchParams.append('diet', dietType);
      }
      
      if (maxCalories) {
        url.searchParams.append('maxCalories', maxCalories.toString());
      }

      console.log(`Searching Spoonacular API with query: ${query}`);
      const response = await fetch(url.toString());
      this.validateApiResponse(response, 'Spoonacular');
      const data = await response.json();

      if (!data.results || !Array.isArray(data.results)) {
        console.error('Invalid Spoonacular API response format:', data);
        throw new Error('Invalid API response format');
      }

      if (data.results.length === 0) {
        console.warn(`No recipes found for query: ${query}`);
        return this.getMockRecipeData();
      }

      const validRecipes = data.results.filter((recipe: SpoonacularRecipe) => this.validateRecipeData(recipe));
      
      if (validRecipes.length === 0) {
        console.warn('No valid recipes found in API response');
        return this.getMockRecipeData();
      }

      return validRecipes.map((recipe: SpoonacularRecipe) => ({
        name: recipe.title,
        ingredients: recipe.extendedIngredients.map(i => `${i.amount} ${i.unit} ${i.name}`),
        instructions: recipe.analyzedInstructions[0].steps.map(s => s.step),
        nutrition: this.extractNutrition(recipe.nutrition?.nutrients || []),
        servings: recipe.servings,
        prepTime: recipe.readyInMinutes,
        cookTime: Math.floor(recipe.readyInMinutes * 0.7),
        pricePerServing: recipe.pricePerServing,
        image: recipe.image
      }));
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return this.getMockRecipeData();
    }
  }

  public async getNutritionSpoonacular(ingredients: string[]): Promise<NutritionData | null> {
    try {
      if (!this.spoonacularApiKey) {
        console.warn('Spoonacular API key not found');
        return null;
      }

      const url = new URL('https://api.spoonacular.com/recipes/parseIngredients');
      url.searchParams.append('apiKey', this.spoonacularApiKey);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          ingredientList: ingredients.join('\n'),
          servings: '1'
        })
      });

      await this.validateApiResponse(response, 'Spoonacular Nutrition');
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        return null;
      }

      return this.extractNutrition(data[0].nutrition?.nutrients || []);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      return null;
    }
  }

  private extractNutrition(nutrients: Array<{ name: string; amount: number; unit: string }>): NutritionData {
    const getNutrientAmount = (name: string): number => {
      const nutrient = nutrients.find(n => n.name.toLowerCase() === name.toLowerCase());
      return Math.round(nutrient?.amount || 0);
    };

    return {
      calories: getNutrientAmount('Calories'),
      protein: getNutrientAmount('Protein'),
      carbs: getNutrientAmount('Carbohydrates'),
      fats: getNutrientAmount('Fat'),
      fiber: getNutrientAmount('Fiber'),
      sugar: getNutrientAmount('Sugar'),
      sodium: getNutrientAmount('Sodium')
    };
  }

  private getMockRecipeData(): RecipeData[] {
    return [
      {
        name: 'Quinoa Buddha Bowl',
        ingredients: [
          '1 cup quinoa',
          '2 cups water',
          '1 sweet potato, cubed',
          '1 can chickpeas, drained',
          '2 cups kale, chopped',
          '1 avocado, sliced',
          '2 tbsp olive oil',
          '2 tbsp tahini'
        ],
        instructions: [
          'Cook quinoa according to package instructions',
          'Roast sweet potato and chickpeas with olive oil',
          'Massage kale with olive oil',
          'Assemble bowls with quinoa base',
          'Top with roasted vegetables and avocado',
          'Drizzle with tahini'
        ],
        nutrition: {
          calories: 450,
          protein: 15,
          carbs: 55,
          fats: 22,
          fiber: 12,
          sugar: 5,
          sodium: 400
        },
        servings: 4,
        prepTime: 20,
        cookTime: 25,
        pricePerServing: 3.50,
        image: 'https://source.unsplash.com/400x400/?quinoa,bowl'
      }
    ];
  }
}

