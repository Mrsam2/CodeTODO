import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '@/server/db';
import { User } from '@/server/models/User';
import { UserData } from '@/server/models/UserData';
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
        const existingUser = await User.findOne({ email: formattedEmail });
        if (existingUser) {
          return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email: formattedEmail, password: hashedPassword });
        await user.save();

        const userData = new UserData({
          userId: user._id,
          categories: [],
          roadmapNodes: [],
          todos: [],
          dayPlans: [],
          notes: [],
          savedLinks: [],
          futureIdeas: [],
          shiftLogs: [],
          settings: {},
        });
        await userData.save();

        const token = signToken({ userId: user._id.toString(), email: user.email });
        dbQuerySucceeded = true;
        return NextResponse.json({ token, user: { id: user._id, email: user.email } }, { status: 201 });
      } catch (dbErr) {
        console.warn('MongoDB query failed during signup, falling back to in-memory mode:', (dbErr as Error).message);
      }
    }

    if (!dbQuerySucceeded) {
      const existingUser = memoryDb.users.find((u) => u.email === formattedEmail);
      if (existingUser) {
        return NextResponse.json({ error: 'User with this email already exists (memory mode)' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const mockId = new mongoose.Types.ObjectId().toString();
      const user = { _id: mockId, email: formattedEmail, password: hashedPassword };

      memoryDb.users.push(user);
      memoryDb.userData[mockId] = {
        userId: mockId,
        categories: [],
        roadmapNodes: [],
        todos: [],
        dayPlans: [],
        notes: [],
        savedLinks: [],
        futureIdeas: [],
        shiftLogs: [],
        studyPlans: [],
        aiSuggestions: [],
        settings: {},
        lastSyncAt: Date.now(),
      };

      const token = signToken({ userId: mockId, email: user.email });
      return NextResponse.json({ token, user: { id: mockId, email: user.email } }, { status: 201 });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error during signup' }, { status: 500 });
  }
}
