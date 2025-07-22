import { NextResponse } from "next/server";

const sampleChallenges = [
  {
    id: "challenge1",
    title: "Eat 5 Veggies a Day",
    description: "Log at least 5 servings of vegetables every day for a week.",
    participants: 42
  },
  {
    id: "challenge2",
    title: "Budget Meal Master",
    description: "Stay under $40 for your weekly meal plan.",
    participants: 27
  }
];

export async function GET() {
  return NextResponse.json(sampleChallenges);
}
