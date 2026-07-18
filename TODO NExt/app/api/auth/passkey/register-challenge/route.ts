import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/server/auth';

export async function GET(req: NextRequest) {
  try {
    const userPayload = verifyToken(req);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a secure random challenge
    const challenge = Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString()).toString('base64');

    return NextResponse.json({
      challenge,
      rp: {
        name: 'My Day',
        id: req.nextUrl.hostname === 'localhost' ? 'localhost' : req.nextUrl.hostname,
      },
      user: {
        id: userPayload.userId,
        name: userPayload.email,
        displayName: userPayload.email,
      },
    });
  } catch (error) {
    console.error('Passkey register challenge error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
