import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB, isDbConnected } from '@/server/db';
import { User } from '@/server/models/User';
import { signToken } from '@/server/auth';
import { memoryDb } from '@/server/memoryDb';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const formattedEmail = email.toLowerCase().trim();

    let dbReady = false;
    try {
      await connectDB();
      dbReady = isDbConnected();
    } catch {
      dbReady = false;
    }

    let dbQuerySucceeded = false;
    if (dbReady) {
      try {
        const user = await User.findOne({ email: formattedEmail });
        if (!user) {
          return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
        }
        const token = signToken({ userId: user._id.toString(), email: user.email });
        dbQuerySucceeded = true;
        return NextResponse.json({ token, user: { id: user._id, email: user.email } }, { status: 200 });
      } catch (dbErr) {
        console.warn('MongoDB query failed during login, falling back to in-memory mode:', (dbErr as Error).message);
      }
    }

    if (!dbQuerySucceeded) {
      const user = memoryDb.users.find((u) => u.email === formattedEmail);
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password (memory mode)' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid email or password (memory mode)' }, { status: 400 });
      }
      const token = signToken({ userId: user._id, email: user.email });
      return NextResponse.json({ token, user: { id: user._id, email: user.email } }, { status: 200 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
