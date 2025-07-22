import { getPrice } from "./localPrices";
import { Recipe } from "./culturalRecipes";

// Aggregates ingredients from a list of recipes and estimates total cost
export function generateShoppingList(recipes: Recipe[]) {
  const ingredientMap: Record<string, { quantity: number; cost: number }> = {};

  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const key = ing.item.toLowerCase();
      const price = getPrice(key) ?? ing.cost_estimate ?? 0;
      if (!ingredientMap[key]) {
        ingredientMap[key] = { quantity: 0, cost: 0 };
      }
      // For simplicity, just count each ingredient occurrence (expand for real units)
      ingredientMap[key].quantity += 1;
      ingredientMap[key].cost += price;
    });
  });

  const list = Object.entries(ingredientMap).map(([item, data]) => ({
    item,
    quantity: data.quantity,
    estimated_cost: data.cost
  }));

  const totalCost = list.reduce((sum, i) => sum + i.estimated_cost, 0);

  return { list, totalCost };
}
