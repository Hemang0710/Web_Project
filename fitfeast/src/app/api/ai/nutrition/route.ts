import { NextRequest, NextResponse } from "next/server";
import { estimateNutritionAI } from "@/app/lib/aiUtils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  let nutrition: any;
  if (Array.isArray(body.ingredients)) {
    nutrition = await estimateNutritionAI(body.ingredients);
  } else if (typeof body.prompt === 'string') {
    nutrition = await estimateNutritionAI([body.prompt]);
  } else {
    return NextResponse.json({ error: 'Missing ingredients array or prompt string in request body.' }, { status: 400 });
  }
  return NextResponse.json(nutrition);
} 