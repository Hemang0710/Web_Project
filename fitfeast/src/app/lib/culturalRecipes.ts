export interface Ingredient {
  item: string;
  quantity: string;
  cost_estimate: number;
}

export interface Recipe {
  recipe_id: string;
  name: string;
  cuisine_type: string;
  region: string;
  estimated_cost: number;
  servings: number;
  prep_time: number;
  ingredients: Ingredient[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  instructions: string[];
  dietary_tags: string[];
}

// Example recipes (expand as needed)
export const culturalRecipes: Recipe[] = [
  {
    recipe_id: "indian_chana_masala",
    name: "Chana Masala",
    cuisine_type: "Indian",
    region: "South Asia",
    estimated_cost: 4.00,
    servings: 4,
    prep_time: 30,
    ingredients: [
      { item: "chickpeas", quantity: "2 cups", cost_estimate: 1.00 },
      { item: "tomato", quantity: "1 cup", cost_estimate: 0.85 },
      { item: "onion", quantity: "1 medium", cost_estimate: 0.60 }
    ],
    nutrition: { calories: 320, protein: 12, carbs: 45, fat: 6 },
    instructions: [
      "Soak and cook chickpeas.",
      "Saute onion and tomato.",
      "Add spices and chickpeas, simmer."
    ],
    dietary_tags: ["vegetarian", "high_protein", "budget_friendly"]
  },
  // Add more recipes for other cultures/regions
];
