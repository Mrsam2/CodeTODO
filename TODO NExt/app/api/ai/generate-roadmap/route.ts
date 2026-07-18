import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap } from '@/server/ai/gemini';

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured on server' }, { status: 500 });
  }
  const body = await req.json();
  const result = await generateRoadmap(body);
  return NextResponse.json(result);
}
