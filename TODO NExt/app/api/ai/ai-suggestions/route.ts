import { NextRequest, NextResponse } from 'next/server';
import { generateAISuggestions } from '@/server/ai/gemini';

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured on server' }, { status: 500 });
  }
  const body = await req.json();
  try {
    const result = await generateAISuggestions(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
