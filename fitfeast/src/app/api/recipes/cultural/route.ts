import { NextResponse } from "next/server";
import { culturalRecipes } from "@/app/lib/culturalRecipes";

export async function GET() {
  return NextResponse.json(culturalRecipes);
} 