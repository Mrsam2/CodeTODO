import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isDbConnected } from '@/server/db';
import { User } from '@/server/models/User';
import { signToken } from '@/server/auth';
import { memoryDb } from '@/server/memoryDb';

export async function POST(req: NextRequest) {
  try {
    const { email, credentialId } = await req.json();
    if (!email || !credentialId) {
      return NextResponse.json({ error: 'Email and Credential ID are required' }, { status: 400 });
    }

    const formattedEmail = email.toLowerCase().trim();

    let dbReady = false;
    try {
      await connectDB();
      dbReady = isDbConnected();
    } catch {
      dbReady = false;
    }

    if (dbReady) {
      const user = await User.findOne({ email: formattedEmail });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const hasPasskey = user.passkeys.some((pk: { credentialId: string }) => pk.credentialId === credentialId);
      if (!hasPasskey) {
        return NextResponse.json({ error: 'Invalid passkey credential' }, { status: 400 });
      }

      const token = signToken({ userId: user._id.toString(), email: user.email });
      return NextResponse.json({ token, user: { id: user._id.toString(), email: user.email, name: user.name } }, { status: 200 });
    } else {
      const user = memoryDb.users.find((u) => u.email === formattedEmail);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const hasPasskey = user.passkeys?.some((pk) => pk.credentialId === credentialId);
      if (!hasPasskey) {
        return NextResponse.json({ error: 'Invalid passkey credential' }, { status: 400 });
      }

      const token = signToken({ userId: user._id, email: user.email });
      return NextResponse.json({ token, user: { id: user._id, email: user.email, name: user.name } }, { status: 200 });
    }
  } catch (error) {
    console.error('Passkey login error:', error);
    return NextResponse.json({ error: 'Internal server error during passkey login' }, { status: 500 });
  }
}
