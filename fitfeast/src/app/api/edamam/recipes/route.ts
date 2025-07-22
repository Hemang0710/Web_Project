import { NextRequest, NextResponse } from "next/server";
import { ExternalAPIService } from "@/app/lib/externalAPI";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    // Use the correct function from ExternalAPIService
    const apiService = new ExternalAPIService();
    const recipes = await apiService.searchRecipesSpoonacular(query);
    return NextResponse.json({ recipes });
  } catch (error) {
    let message = 'Failed to fetch recipes';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 