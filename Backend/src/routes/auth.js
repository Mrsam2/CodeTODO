import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { User } from '../models/User.js';
import { UserData } from '../models/UserData.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Configure Nodemailer for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// In-memory fallback database when MongoDB connection is not active
export const memoryDb = {
  users: [],
  userData: {},
};

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    let dbQuerySucceeded = false;
    if (isDbConnected) {
      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
          email,
          password: hashedPassword,
        });
        await user.save();

        // Initialize user data document
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

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
          expiresIn: '180d',
        });

        dbQuerySucceeded = true;
        return res.status(201).json({
          token,
          user: {
            id: user._id,
            email: user.email,
          },
        });
      } catch (dbErr) {
        console.warn('MongoDB query failed during signup, falling back to in-memory mode:', dbErr.message);
      }
    }

    if (!dbQuerySucceeded) {
      // Degraded Mode (In-memory fallback)
      const existingUser = memoryDb.users.find((u) => u.email === email.toLowerCase().trim());
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists (memory mode)' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const mockId = new mongoose.Types.ObjectId().toString();
      const user = {
        _id: mockId,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      };
      
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
        settings: {},
        lastSyncAt: Date.now(),
      };

      const token = jwt.sign({ userId: mockId, email: user.email }, JWT_SECRET, {
        expiresIn: '180d',
      });

      return res.status(201).json({
        token,
        user: {
          id: mockId,
          email: user.email,
        },
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    let dbQuerySucceeded = false;
    if (isDbConnected) {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
          expiresIn: '180d',
        });

        dbQuerySucceeded = true;
        return res.status(200).json({
          token,
          user: {
            id: user._id,
            email: user.email,
          },
        });
      } catch (dbErr) {
        console.warn('MongoDB query failed during login, falling back to in-memory mode:', dbErr.message);
      }
    }

    if (!dbQuerySucceeded) {
      // Degraded Mode (In-memory fallback)
      const user = memoryDb.users.find((u) => u.email === email.toLowerCase().trim());
      if (!user) {
        return res.status(400).json({ error: 'Invalid email or password (memory mode)' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid email or password (memory mode)' });
      }

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
        expiresIn: '180d',
      });

      return res.status(200).json({
        token,
        user: {
          id: user._id,
          email: user.email,
        },
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Forgot Password Endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const formattedEmail = email.toLowerCase().trim();
    const isDbConnected = mongoose.connection.readyState === 1;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let userFound = false;

    if (isDbConnected) {
      try {
        const user = await User.findOne({ email: formattedEmail });
        if (user) {
          user.resetOtp = otp;
          user.resetOtpExpiresAt = expiresAt;
          await user.save();
          userFound = true;
        }
      } catch (dbErr) {
        console.warn('MongoDB query failed during forgot-password:', dbErr.message);
      }
    }

    if (!userFound) {
      // In-memory fallback
      const user = memoryDb.users.find((u) => u.email === formattedEmail);
      if (user) {
        user.resetOtp = otp;
        user.resetOtpExpiresAt = expiresAt;
        userFound = true;
      }
    }

    if (!userFound) {
      return res.status(400).json({ error: 'User with this email does not exist' });
    }

    // Always log OTP to console for local testing/fallback
    console.log(`[PASSWORD RESET OTP] For: ${formattedEmail} | OTP: ${otp}`);

    // Check if mail environment variables are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('WARNING: Gmail credentials not configured. OTP printed to console instead.');
      return res.status(200).json({
        message: 'OTP generated successfully (check server logs for local testing)',
        note: 'Email service is not configured in backend environment variables.',
      });
    }

    // Send email using Nodemailer
    const mailOptions = {
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
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'OTP sent to email successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error during forgot password' });
  }
});

// Reset Password Endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const formattedEmail = email.toLowerCase().trim();
    const isDbConnected = mongoose.connection.readyState === 1;
    let resetSucceeded = false;

    if (isDbConnected) {
      try {
        const user = await User.findOne({ email: formattedEmail });
        if (user) {
          if (!user.resetOtp || user.resetOtp !== otp.trim()) {
            return res.status(400).json({ error: 'Invalid OTP' });
          }
          if (new Date() > user.resetOtpExpiresAt) {
            return res.status(400).json({ error: 'OTP has expired' });
          }

          // Hash new password and save
          user.password = await bcrypt.hash(newPassword, 10);
          user.resetOtp = null;
          user.resetOtpExpiresAt = null;
          await user.save();
          resetSucceeded = true;
        }
      } catch (dbErr) {
        console.warn('MongoDB query failed during reset-password:', dbErr.message);
      }
    }

    if (!resetSucceeded) {
      // In-memory fallback
      const user = memoryDb.users.find((u) => u.email === formattedEmail);
      if (!user) {
        return res.status(400).json({ error: 'User with this email does not exist' });
      }

      if (!user.resetOtp || user.resetOtp !== otp.trim()) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }
      if (new Date() > user.resetOtpExpiresAt) {
        return res.status(400).json({ error: 'OTP has expired' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetOtp = null;
      user.resetOtpExpiresAt = null;
      resetSucceeded = true;
    }

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error during password reset' });
  }
});

export default router;
