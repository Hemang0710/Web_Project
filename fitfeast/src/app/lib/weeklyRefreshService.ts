import { connectToDatabase } from '@/app/lib/db';
import User from '@/app/models/User';
import MealPlan from '@/app/models/MealPlan';
import GroceryList from '@/app/models/GroceryList';
import { ExternalAPIService } from '@/app/lib/externalAPI';
import { currencyService } from '@/app/lib/currencyService';
import { groceryPricingService } from '@/app/lib/groceryPricingService';

const externalAPI = new ExternalAPIService();

interface RefreshResult {
  userId: string;
  success: boolean;
  mealPlanId?: string;
  groceryListId?: string;
  error?: string;
}

export class WeeklyRefreshService {
  private async generateMealForUser(
    user: any,
    type: 'breakfast' | 'lunch' | 'dinner',
    cuisine: string,
    budgetUSD: number
  ) {
    try {
      const mealTypes = {
        breakfast: 'breakfast',
        lunch: 'main course lunch',
        dinner: 'main course dinner'
      };

      const searchQuery = `${cuisine} ${mealTypes[type]} ${user.dietType}`;
      const recipes = await externalAPI.searchRecipesSpoonacular(
        searchQuery,
        user.dietType,
        budgetUSD * 100,
        5
      );

      if (!recipes || recipes.length === 0) {
        throw new Error(`No ${type} recipes found for ${cuisine} cuisine`);
      }

      const recipe = recipes[Math.floor(Math.random() * recipes.length)];
      const nutritionData = await externalAPI.getNutritionSpoonacular(recipe.ingredients);

      const costUSD = recipe.pricePerServing || (nutritionData?.calories || 0) / 100;

      return {
        name: recipe.name,
        ingredients: recipe.ingredients,
        calories: nutritionData?.calories || 0,
        cost: costUSD,
        nutrition: {
          protein: nutritionData?.protein || 0,
          carbs: nutritionData?.carbs || 0,
          fats: nutritionData?.fats || 0,
          fiber: nutritionData?.fiber || 0
        }
      };
    } catch (error) {
      console.error(`Error generating ${type} meal for user ${user._id}:`, error);
      throw error;
    }
  }

  private async generateWeeklyMealPlan(user: any): Promise<string> {
    const budgetUSD = await currencyService.convertBudgetToUSD(user.budgetWeekly, user.currency);
    const dailyBudgetUSD = budgetUSD / 7;
    const mealBudgetUSD = dailyBudgetUSD / 3;

    const cuisine = user.preferredCuisine?.[0] || 'Italian';
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const meals = [];

    for (let i = 0; i < 7; i++) {
      try {
        const [breakfast, lunch, dinner] = await Promise.all([
          this.generateMealForUser(user, 'breakfast', cuisine, mealBudgetUSD),
          this.generateMealForUser(user, 'lunch', cuisine, mealBudgetUSD),
          this.generateMealForUser(user, 'dinner', cuisine, mealBudgetUSD)
        ]);

        meals.push({
          day: dayNames[weekStart.getDay() + i],
          breakfast,
          lunch,
          dinner
        });
      } catch (error) {
        console.error(`Failed to generate meals for day ${i + 1}:`, error);
        // Use fallback meals
        meals.push({
          day: dayNames[weekStart.getDay() + i],
          breakfast: {
            name: 'Simple Breakfast',
            ingredients: ['eggs', 'bread', 'butter'],
            calories: 300,
            cost: mealBudgetUSD,
            nutrition: { protein: 15, carbs: 30, fats: 12, fiber: 2 }
          },
          lunch: {
            name: 'Simple Lunch',
            ingredients: ['chicken', 'rice', 'vegetables'],
            calories: 500,
            cost: mealBudgetUSD,
            nutrition: { protein: 25, carbs: 45, fats: 15, fiber: 5 }
          },
          dinner: {
            name: 'Simple Dinner',
            ingredients: ['salmon', 'pasta', 'sauce'],
            calories: 600,
            cost: mealBudgetUSD,
            nutrition: { protein: 30, carbs: 50, fats: 20, fiber: 3 }
          }
        });
      }
    }

    const totalCost = meals.reduce((sum, day) => {
      return sum + (day.breakfast?.cost || 0) + (day.lunch?.cost || 0) + (day.dinner?.cost || 0);
    }, 0);

    const totalCalories = meals.reduce((sum, day) => {
      return sum + (day.breakfast?.calories || 0) + (day.lunch?.calories || 0) + (day.dinner?.calories || 0);
    }, 0);

    const mealPlan = new MealPlan({
      userId: user._id,
      title: `Weekly ${cuisine} ${user.dietType} Meal Plan`,
      description: `Auto-generated meal plan for ${cuisine} cuisine with ${user.dietType} diet`,
      budget: budgetUSD,
      location: user.location,
      startDate: weekStart,
      endDate: weekEnd,
      meals,
      totalCost: Number(totalCost.toFixed(2)),
      totalCalories: Math.round(totalCalories),
      isActive: true
    });

    await mealPlan.save();
    return mealPlan._id.toString();
  }

  private async generateGroceryList(user: any, mealPlanId: string): Promise<string> {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      throw new Error('Meal plan not found');
    }

    // Extract all ingredients
    const allIngredients: string[] = [];
    mealPlan.meals.forEach((dayMeal: any) => {
      if (dayMeal.breakfast?.ingredients) {
        allIngredients.push(...dayMeal.breakfast.ingredients);
      }
      if (dayMeal.lunch?.ingredients) {
        allIngredients.push(...dayMeal.lunch.ingredients);
      }
      if (dayMeal.dinner?.ingredients) {
        allIngredients.push(...dayMeal.dinner.ingredients);
      }
    });

    // Aggregate ingredients
    const aggregatedIngredients = groceryPricingService.aggregateIngredients(allIngredients);

    // Convert to grocery items
    const groceryItems = Object.values(aggregatedIngredients).map(ingredient => ({
      name: ingredient.name,
      category: this.getCategoryForIngredient(ingredient.name),
      quantity: `${ingredient.quantity} ${ingredient.unit}`,
      estimatedCost: ingredient.estimatedCostUSD,
      isPurchased: false,
      notes: ''
    }));

    const totalEstimatedCost = groceryItems.reduce((sum, item) => sum + item.estimatedCost, 0);

    const groceryList = new GroceryList({
      userId: user._id,
      mealPlanId: mealPlan._id,
      title: `Grocery List for ${mealPlan.title}`,
      items: groceryItems,
      totalEstimatedCost: Number(totalEstimatedCost.toFixed(2)),
      isCompleted: false
    });

    await groceryList.save();
    return groceryList._id.toString();
  }

  private getCategoryForIngredient(ingredientName: string): string {
    const name = ingredientName.toLowerCase();
    
    if (['tomato', 'onion', 'garlic', 'bell pepper', 'carrot', 'potato', 'spinach', 'lettuce'].some(item => name.includes(item))) {
      return 'Produce';
    }
    
    if (['milk', 'cheese', 'yogurt', 'butter', 'eggs'].some(item => name.includes(item))) {
      return 'Dairy';
    }
    
    if (['chicken', 'beef', 'pork', 'salmon', 'fish', 'meat'].some(item => name.includes(item))) {
      return 'Meat & Seafood';
    }
    
    if (['rice', 'pasta', 'bread', 'flour', 'sugar', 'oil', 'salt', 'pepper'].some(item => name.includes(item))) {
      return 'Pantry';
    }
    
    return 'Other';
  }

  public async refreshUserMealPlan(userId: string): Promise<RefreshResult> {
    try {
      await connectToDatabase();

      const user = await User.findById(userId);
      if (!user) {
        return { userId, success: false, error: 'User not found' };
      }

      // Deactivate current active meal plan
      await MealPlan.updateMany(
        { userId: user._id, isActive: true },
        { isActive: false }
      );

      // Generate new meal plan
      const mealPlanId = await this.generateWeeklyMealPlan(user);

      // Generate grocery list
      const groceryListId = await this.generateGroceryList(user, mealPlanId);

      return {
        userId,
        success: true,
        mealPlanId,
        groceryListId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error refreshing meal plan for user ${userId}:`, error);
      return {
        userId,
        success: false,
        error: errorMessage
      };
    }
  }

  public async refreshAllUsers(): Promise<RefreshResult[]> {
    try {
      await connectToDatabase();

      const users = await User.find({
        budgetWeekly: { $exists: true, $gt: 0 },
        preferredCuisine: { $exists: true, $ne: [] },
        dietType: { $exists: true }
      });

      console.log(`Refreshing meal plans for ${users.length} users`);

      const results: RefreshResult[] = [];

      // Process users in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const batchPromises = batch.map(user => this.refreshUserMealPlan(user._id.toString()));
        
        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              userId: batch[index]._id.toString(),
              success: false,
              error: result.reason?.message || 'Unknown error'
            });
          }
        });

        // Add delay between batches to respect API rate limits
        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`Weekly refresh completed: ${successCount}/${results.length} users refreshed successfully`);

      return results;

    } catch (error) {
      console.error('Error in weekly refresh:', error);
      return [];
    }
  }
}

export const weeklyRefreshService = new WeeklyRefreshService(); 