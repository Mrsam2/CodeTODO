import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isDbConnected } from '@/server/db';
import { User } from '@/server/models/User';
import { signToken } from '@/server/auth';
import { memoryDb } from '@/server/memoryDb';

export async function POST(req: NextRequest) {
  try {
    const { credential, isMock, email: mockEmail, name: mockName } = await req.json();

    let email = '';
    let name = '';

    if (isMock) {
      email = mockEmail.toLowerCase().trim();
      name = mockName.trim();
    } else {
      // Decode standard Google ID Token (JWT)
      const parts = credential.split('.');
      if (parts.length !== 3) {
        return NextResponse.json({ error: 'Invalid Google credential token format' }, { status: 400 });
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      email = payload.email.toLowerCase().trim();
      name = payload.name || payload.given_name || '';
    }

    if (!email) {
      return NextResponse.json({ error: 'Could not retrieve email from Google login' }, { status: 400 });
    }

    let dbReady = false;
    try {
      await connectDB();
      dbReady = isDbConnected();
    } catch {
      dbReady = false;
    }

    if (dbReady) {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          name,
          password: `google-oauth-${Math.random()}`,
          passkeys: [],
        });
      } else if (name && !user.name) {
        user.name = name;
        await user.save();
      }

      const token = signToken({ userId: user._id.toString(), email: user.email });
      return NextResponse.json({ token, user: { id: user._id.toString(), email: user.email, name: user.name } }, { status: 200 });
    } else {
      // Memory DB fallback
      let user = memoryDb.users.find((u) => u.email === email);
      if (!user) {
        const userId = `mem-${Math.random().toString(36).substring(2, 11)}`;
        user = {
          _id: userId,
          email,
          name,
          password: `google-oauth-${Math.random()}`,
          passkeys: [],
        };
        memoryDb.users.push(user);
      } else if (name && !user.name) {
        user.name = name;
      }

      const token = signToken({ userId: user._id, email: user.email });
      return NextResponse.json({ token, user: { id: user._id, email: user.email, name: user.name } }, { status: 200 });
    }
  } catch (error) {
    console.error('Google login API error:', error);
    return NextResponse.json({ error: 'Internal server error during Google login' }, { status: 500 });
  }
}
