import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

/* ---------- GET ---------- */
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const query = Object.fromEntries(req.nextUrl.searchParams);

    return NextResponse.json(
      { message: 'Not implemented', id, query },
      { status: 501, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/* ---------- PUT ---------- */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await req.json();

    return NextResponse.json(
      { message: 'Not implemented', id, body },
      { status: 501 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/* ---------- DELETE ---------- */
export async function DELETE(_: NextRequest, { params }: Context) {
  try {
    const { id } = await params;

    return NextResponse.json({ message: 'Not implemented', id }, { status: 501 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}