import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { UserData } from '../models/UserData.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

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

export default router;
