interface GroceryItem {
  name: string;
  category: string;
  unit: string;
  priceUSD: number;
  pricePerUnit: number;
  availability: string[];
}

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  estimatedCostUSD: number;
  estimatedCostLocal: number;
  localCurrency: string;
}

export class GroceryPricingService {
  private readonly fallbackPrices: Record<string, GroceryItem> = {
    // Produce
    'tomato': { name: 'tomato', category: 'Produce', unit: 'piece', priceUSD: 0.5, pricePerUnit: 0.5, availability: ['global'] },
    'onion': { name: 'onion', category: 'Produce', unit: 'piece', priceUSD: 0.3, pricePerUnit: 0.3, availability: ['global'] },
    'garlic': { name: 'garlic', category: 'Produce', unit: 'clove', priceUSD: 0.1, pricePerUnit: 0.1, availability: ['global'] },
    'bell pepper': { name: 'bell pepper', category: 'Produce', unit: 'piece', priceUSD: 1.0, pricePerUnit: 1.0, availability: ['global'] },
    'carrot': { name: 'carrot', category: 'Produce', unit: 'piece', priceUSD: 0.4, pricePerUnit: 0.4, availability: ['global'] },
    'potato': { name: 'potato', category: 'Produce', unit: 'piece', priceUSD: 0.6, pricePerUnit: 0.6, availability: ['global'] },
    'spinach': { name: 'spinach', category: 'Produce', unit: 'bunch', priceUSD: 2.0, pricePerUnit: 2.0, availability: ['global'] },
    'lettuce': { name: 'lettuce', category: 'Produce', unit: 'head', priceUSD: 1.5, pricePerUnit: 1.5, availability: ['global'] },
    
    // Dairy
    'milk': { name: 'milk', category: 'Dairy', unit: 'gallon', priceUSD: 3.5, pricePerUnit: 3.5, availability: ['global'] },
    'cheese': { name: 'cheese', category: 'Dairy', unit: 'pound', priceUSD: 4.0, pricePerUnit: 4.0, availability: ['global'] },
    'yogurt': { name: 'yogurt', category: 'Dairy', unit: 'cup', priceUSD: 1.0, pricePerUnit: 1.0, availability: ['global'] },
    'butter': { name: 'butter', category: 'Dairy', unit: 'pound', priceUSD: 3.0, pricePerUnit: 3.0, availability: ['global'] },
    'eggs': { name: 'eggs', category: 'Dairy', unit: 'dozen', priceUSD: 2.5, pricePerUnit: 2.5, availability: ['global'] },
    
    // Meat & Seafood
    'chicken breast': { name: 'chicken breast', category: 'Meat & Seafood', unit: 'pound', priceUSD: 3.5, pricePerUnit: 3.5, availability: ['global'] },
    'ground beef': { name: 'ground beef', category: 'Meat & Seafood', unit: 'pound', priceUSD: 4.5, pricePerUnit: 4.5, availability: ['global'] },
    'salmon': { name: 'salmon', category: 'Meat & Seafood', unit: 'pound', priceUSD: 8.0, pricePerUnit: 8.0, availability: ['global'] },
    'shrimp': { name: 'shrimp', category: 'Meat & Seafood', unit: 'pound', priceUSD: 6.0, pricePerUnit: 6.0, availability: ['global'] },
    
    // Pantry
    'rice': { name: 'rice', category: 'Pantry', unit: 'pound', priceUSD: 1.0, pricePerUnit: 1.0, availability: ['global'] },
    'pasta': { name: 'pasta', category: 'Pantry', unit: 'pound', priceUSD: 1.5, pricePerUnit: 1.5, availability: ['global'] },
    'olive oil': { name: 'olive oil', category: 'Pantry', unit: 'bottle', priceUSD: 8.0, pricePerUnit: 8.0, availability: ['global'] },
    'salt': { name: 'salt', category: 'Pantry', unit: 'pound', priceUSD: 0.5, pricePerUnit: 0.5, availability: ['global'] },
    'black pepper': { name: 'black pepper', category: 'Pantry', unit: 'ounce', priceUSD: 2.0, pricePerUnit: 2.0, availability: ['global'] },
    'flour': { name: 'flour', category: 'Pantry', unit: 'pound', priceUSD: 1.0, pricePerUnit: 1.0, availability: ['global'] },
    'sugar': { name: 'sugar', category: 'Pantry', unit: 'pound', priceUSD: 0.8, pricePerUnit: 0.8, availability: ['global'] },
    
    // Spices & Herbs
    'cumin': { name: 'cumin', category: 'Pantry', unit: 'ounce', priceUSD: 3.0, pricePerUnit: 3.0, availability: ['global'] },
    'turmeric': { name: 'turmeric', category: 'Pantry', unit: 'ounce', priceUSD: 2.5, pricePerUnit: 2.5, availability: ['global'] },
    'oregano': { name: 'oregano', category: 'Pantry', unit: 'ounce', priceUSD: 2.0, pricePerUnit: 2.0, availability: ['global'] },
    'basil': { name: 'basil', category: 'Pantry', unit: 'ounce', priceUSD: 2.5, pricePerUnit: 2.5, availability: ['global'] },
    
    // Canned Goods
    'tomato sauce': { name: 'tomato sauce', category: 'Pantry', unit: 'can', priceUSD: 1.0, pricePerUnit: 1.0, availability: ['global'] },
    'beans': { name: 'beans', category: 'Pantry', unit: 'can', priceUSD: 0.8, pricePerUnit: 0.8, availability: ['global'] },
    'tuna': { name: 'tuna', category: 'Pantry', unit: 'can', priceUSD: 1.5, pricePerUnit: 1.5, availability: ['global'] },
    
    // Beverages
    'orange juice': { name: 'orange juice', category: 'Beverages', unit: 'gallon', priceUSD: 4.0, pricePerUnit: 4.0, availability: ['global'] },
    'coffee': { name: 'coffee', category: 'Beverages', unit: 'pound', priceUSD: 8.0, pricePerUnit: 8.0, availability: ['global'] },
    'tea': { name: 'tea', category: 'Beverages', unit: 'box', priceUSD: 3.0, pricePerUnit: 3.0, availability: ['global'] }
  };

  private normalizeIngredientName(name: string): string {
    return name.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  public findBestMatch(ingredientName: string): GroceryItem | null {
    const normalizedName = this.normalizeIngredientName(ingredientName);
    
    // Exact match
    if (this.fallbackPrices[normalizedName]) {
      return this.fallbackPrices[normalizedName];
    }
    
    // Partial match
    for (const [key, item] of Object.entries(this.fallbackPrices)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return item;
      }
    }
    
    // Category-based fallback
    const categoryFallbacks: Record<string, GroceryItem> = {
      'vegetable': this.fallbackPrices['tomato'],
      'fruit': this.fallbackPrices['tomato'],
      'meat': this.fallbackPrices['chicken breast'],
      'fish': this.fallbackPrices['salmon'],
      'grain': this.fallbackPrices['rice'],
      'spice': this.fallbackPrices['salt'],
      'herb': this.fallbackPrices['basil']
    };
    
    for (const [category, fallback] of Object.entries(categoryFallbacks)) {
      if (normalizedName.includes(category)) {
        return fallback;
      }
    }
    
    return null;
  }

  public estimateIngredientCost(
    ingredientName: string,
    quantity: number,
    unit: string,
    localCurrency: string = 'USD'
  ): Ingredient {
    const item = this.findBestMatch(ingredientName);
    let estimatedCostUSD = 0;
    
    if (item) {
      // Simple estimation based on unit conversion
      const unitMultipliers: Record<string, number> = {
        'piece': 1,
        'pieces': 1,
        'cup': 0.25, // Assuming 1 cup ≈ 0.25 pounds
        'cups': 0.25,
        'tablespoon': 0.0625, // 1 tbsp ≈ 0.0625 cups
        'tbsp': 0.0625,
        'teaspoon': 0.0208, // 1 tsp ≈ 0.0208 cups
        'tsp': 0.0208,
        'ounce': 0.0625, // 1 oz ≈ 0.0625 pounds
        'oz': 0.0625,
        'pound': 1,
        'pounds': 1,
        'lb': 1,
        'lbs': 1,
        'gram': 0.00220462, // 1 g ≈ 0.00220462 pounds
        'grams': 0.00220462,
        'g': 0.00220462,
        'kilogram': 2.20462, // 1 kg ≈ 2.20462 pounds
        'kilograms': 2.20462,
        'kg': 2.20462,
        'clove': 0.1, // Rough estimate for garlic cloves
        'cloves': 0.1,
        'bunch': 1, // Assume 1 bunch ≈ 1 unit
        'head': 1, // Assume 1 head ≈ 1 unit
        'can': 1, // Assume 1 can ≈ 1 unit
        'bottle': 1 // Assume 1 bottle ≈ 1 unit
      };
      
      const multiplier = unitMultipliers[unit.toLowerCase()] || 1;
      estimatedCostUSD = item.pricePerUnit * quantity * multiplier;
    } else {
      // Default fallback price
      estimatedCostUSD = quantity * 2.0; // $2 per unit as default
    }
    
    // For now, use a simple conversion (in a real app, you'd use the currency service)
    const exchangeRates: Record<string, number> = {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
      INR: 74.5,
      CAD: 1.25,
      AUD: 1.35,
      JPY: 110.0,
      CNY: 6.45,
      BRL: 5.25,
      MXN: 20.0
    };
    
    const rate = exchangeRates[localCurrency] || 1;
    const estimatedCostLocal = estimatedCostUSD * rate;
    
    return {
      name: ingredientName,
      quantity,
      unit,
      estimatedCostUSD: Number(estimatedCostUSD.toFixed(2)),
      estimatedCostLocal: Number(estimatedCostLocal.toFixed(2)),
      localCurrency
    };
  }

  public aggregateIngredients(ingredients: string[]): Record<string, Ingredient> {
    const aggregated: Record<string, Ingredient> = {};
    
    for (const ingredient of ingredients) {
      // Parse ingredient string (e.g., "2 cups rice", "1 pound chicken breast")
      const match = ingredient.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/i);
      
      if (match) {
        const [, quantityStr, unit, name] = match;
        const quantity = parseFloat(quantityStr);
        const normalizedName = this.normalizeIngredientName(name);
        
        if (aggregated[normalizedName]) {
          // Add to existing ingredient
          aggregated[normalizedName].quantity += quantity;
        } else {
          const est = this.estimateIngredientCost(name, quantity, unit);
          aggregated[normalizedName] = est;
        }
      } else {
        // Handle simple ingredient names (no quantity/unit)
        const normalizedName = this.normalizeIngredientName(ingredient);
        if (aggregated[normalizedName]) {
          aggregated[normalizedName].quantity += 1;
        } else {
          const est = this.estimateIngredientCost(ingredient, 1, 'unit');
          aggregated[normalizedName] = { ...est, unit: 'unit' };
        }
      }
    }
    
    return aggregated;
  }
}

export const groceryPricingService = new GroceryPricingService(); 