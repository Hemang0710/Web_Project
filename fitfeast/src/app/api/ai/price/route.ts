import { NextRequest, NextResponse } from "next/server";
import { estimatePriceAI } from "@/app/lib/aiUtils";

export async function POST(req: NextRequest) {
  const { ingredient, region, year } = await req.json();
  const price = await estimatePriceAI(ingredient, region, year);
  return NextResponse.json({ ingredient, region, year, price });
} 