import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { connectDB, isDbConnected } from '@/server/db';
import { User } from '@/server/models/User';
import { memoryDb } from '@/server/memoryDb';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let userFound = false;

    if (dbReady) {
      try {
        const user = await User.findOne({ email: formattedEmail });
        if (user) {
          user.resetOtp = otp;
          user.resetOtpExpiresAt = expiresAt;
          await user.save();
          userFound = true;
        }
      } catch (dbErr) {
        console.warn('MongoDB query failed during forgot-password:', (dbErr as Error).message);
      }
    }

    if (!userFound) {
      const user = memoryDb.users.find((u) => u.email === formattedEmail);
      if (user) {
        user.resetOtp = otp;
        user.resetOtpExpiresAt = expiresAt;
        userFound = true;
      }
    }

    if (!userFound) {
      return NextResponse.json({ error: 'User with this email does not exist' }, { status: 400 });
    }

    console.log(`[PASSWORD RESET OTP] For: ${formattedEmail} | OTP: ${otp}`);

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('WARNING: Gmail credentials not configured. OTP printed to console instead.');
      return NextResponse.json({
        message: 'OTP generated successfully (check server logs for local testing)',
        note: 'Email service is not configured in backend environment variables.',
      });
    }

    await transporter.sendMail({
      from: `"My Day Support" <${process.env.GMAIL_USER}>`,
      to: formattedEmail,
      subject: 'My Day App - Password Reset OTP',
      text: `Your OTP for resetting your password is: ${otp}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Use the following One-Time Password (OTP) to complete the process:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #4F46E5; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for <b>10 minutes</b>. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'OTP sent to email successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error during forgot password' }, { status: 500 });
  }
}
