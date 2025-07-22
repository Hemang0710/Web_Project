import { NextRequest, NextResponse } from "next/server";

// GET handler for fetching a grocery list by ID
export async function GET(_req: NextRequest, _context: { params: { id: string } }) {
  // Not implemented yet
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

// PUT handler for updating a grocery list by ID
export async function PUT(_req: NextRequest, _context: { params: { id: string } }) {
  // Not implemented yet
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

// DELETE handler for deleting a grocery list by ID
export async function DELETE(_req: NextRequest, _context: { params: { id: string } }) {
  // Not implemented yet
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}