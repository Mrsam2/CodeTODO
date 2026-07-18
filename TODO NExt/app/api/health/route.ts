import { NextResponse } from 'next/server';
import { connectDB, isDbConnected } from '@/server/db';

export async function GET() {
  try {
    await connectDB();
  } catch {
    // fall through to degraded-mode reporting
  }
  return NextResponse.json({
    status: 'ok',
    database: isDbConnected() ? 'connected' : 'disconnected-memory-fallback',
  });
}
