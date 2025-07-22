import { NextResponse } from "next/server";
import { foodsData } from "@/lib/foodsData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.toLowerCase().trim();

  if (!query) {
    return NextResponse.json({ error: "No query provided" }, { status: 400 });
  }

  // ✅ Instead of exact includes, use partial/fuzzy match
  const match = foodsData.find((f) =>
    f.name.toLowerCase().includes(query)
  );

  if (!match) {
    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  }

  return NextResponse.json({
    food_name: match.name,
    calories: match.calories,
    protein: match.protein,
    carbs: match.carbs,
    fat: match.fat,
  });
}
