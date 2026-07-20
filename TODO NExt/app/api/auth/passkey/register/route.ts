import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/server/auth';
import { connectDB, isDbConnected } from '@/server/db';
import { User } from '@/server/models/User';
import { memoryDb } from '@/server/memoryDb';

export async function POST(req: NextRequest) {
  try {
    const userPayload = verifyToken(req);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credentialId, publicKey, deviceName } = await req.json();
    if (!credentialId || !publicKey) {
      return NextResponse.json({ error: 'Credential ID and Public Key are required' }, { status: 400 });
    }

    let dbReady = false;
    try {
      await connectDB();
      dbReady = isDbConnected();
    } catch {
      dbReady = false;
    }

    const newPasskey = {
      credentialId,
      publicKey,
      counter: 0,
      deviceName: deviceName || 'My Device',
    };

    if (dbReady) {
      const user = await User.findById(userPayload.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const exists = user.passkeys.some((pk: { credentialId: string }) => pk.credentialId === credentialId);
      if (!exists) {
        user.passkeys.push(newPasskey);
        await user.save();
      }

      return NextResponse.json({ success: true, message: 'Passkey registered successfully' }, { status: 200 });
    } else {
      const user = memoryDb.users.find((u) => u._id === userPayload.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!user.passkeys) {
        user.passkeys = [];
      }

      const exists = user.passkeys.some((pk) => pk.credentialId === credentialId);
      if (!exists) {
        user.passkeys.push(newPasskey);
      }

      return NextResponse.json({ success: true, message: 'Passkey registered successfully (memory mode)' }, { status: 200 });
    }
  } catch (error) {
    console.error('Passkey register error:', error);
    return NextResponse.json({ error: 'Internal server error during passkey registration' }, { status: 500 });
  }
}
