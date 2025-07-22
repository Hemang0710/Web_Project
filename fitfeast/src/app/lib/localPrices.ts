// src/app/lib/localPrices.ts

// Mock 2025 grocery prices (USD per unit)
export const localPrices: Record<string, number> = {
  "rice": 1.25,
  "chicken breast": 3.80,
  "eggs": 2.10,
  "milk": 1.60,
  "tomato": 0.85,
  "onion": 0.60,
  "potato": 0.50,
  "black beans": 1.40,
  "lentils": 1.10,
  "bread": 2.50,
  // ...add more as needed
};

// Utility to get price for an ingredient (case-insensitive)
export function getPrice(ingredient: string): number | null {
  const key = ingredient.toLowerCase();
  return localPrices[key] ?? null;
}
