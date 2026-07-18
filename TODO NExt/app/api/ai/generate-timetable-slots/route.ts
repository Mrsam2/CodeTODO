import { NextRequest, NextResponse } from 'next/server';
import { generateTimetableSlots } from '@/server/ai/gemini';

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured on server' }, { status: 500 });
  }
  const body = await req.json();
  if (!body.userPrompt || !body.userPrompt.trim()) {
    return NextResponse.json({ error: 'userPrompt is required' }, { status: 400 });
  }
  try {
    const result = await generateTimetableSlots(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to generate timetable slots' }, { status: 500 });
  }
}
