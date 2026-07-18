import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isDbConnected } from '@/server/db';
import { User } from '@/server/models/User';
import { memoryDb } from '@/server/memoryDb';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const formattedEmail = email.toLowerCase().trim();

    let dbReady = false;
    try {
      await connectDB();
      dbReady = isDbConnected();
    } catch {
      dbReady = false;
    }

    let passkeysList: { credentialId: string }[] = [];

    if (dbReady) {
      const user = await User.findOne({ email: formattedEmail });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      passkeysList = user.passkeys || [];
    } else {
      const user = memoryDb.users.find((u) => u.email === formattedEmail);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      passkeysList = user.passkeys || [];
    }

    if (passkeysList.length === 0) {
      return NextResponse.json({ error: 'No passkeys registered for this email address' }, { status: 400 });
    }

    // Generate challenge
    const challenge = Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString()).toString('base64');

    return NextResponse.json({
      challenge,
      rpId: req.nextUrl.hostname === 'localhost' ? 'localhost' : req.nextUrl.hostname,
      allowCredentials: passkeysList.map((pk) => ({
        id: pk.credentialId,
        type: 'public-key',
      })),
    });
  } catch (error) {
    console.error('Passkey login challenge error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
