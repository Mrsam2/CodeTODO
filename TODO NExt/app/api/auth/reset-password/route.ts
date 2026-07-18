import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB, isDbConnected } from '@/server/db';
import { User } from '@/server/models/User';
import { memoryDb } from '@/server/memoryDb';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    const formattedEmail = email.toLowerCase().trim();
    let dbReady = false;
    try {
      await connectDB();
      dbReady = isDbConnected();
    } catch {
      dbReady = false;
    }

    let resetSucceeded = false;

    if (dbReady) {
      try {
        const user = await User.findOne({ email: formattedEmail });
        if (user) {
          if (!user.resetOtp || user.resetOtp !== otp.trim()) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
          }
          if (new Date() > user.resetOtpExpiresAt) {
            return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
          }
          user.password = await bcrypt.hash(newPassword, 10);
          user.resetOtp = null;
          user.resetOtpExpiresAt = null;
          await user.save();
          resetSucceeded = true;
        }
      } catch (dbErr) {
        console.warn('MongoDB query failed during reset-password:', (dbErr as Error).message);
      }
    }

    if (!resetSucceeded) {
      const user = memoryDb.users.find((u) => u.email === formattedEmail);
      if (!user) {
        return NextResponse.json({ error: 'User with this email does not exist' }, { status: 400 });
      }
      if (!user.resetOtp || user.resetOtp !== otp.trim()) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }
      if (!user.resetOtpExpiresAt || new Date() > user.resetOtpExpiresAt) {
        return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetOtp = null;
      user.resetOtpExpiresAt = null;
    }

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error during password reset' }, { status: 500 });
  }
}
