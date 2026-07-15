import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import syncRoutes from './routes/sync.js';
import aiRoutes from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 8787;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);

// AI routes are mounted at root to prevent breaking client's original pathing (e.g. /generate-roadmap)
app.use('/', aiRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected-memory-fallback',
  });
});

// Database Connection & Server Boot
if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

// Register error listener to catch background reconnection error events and prevent process crash
mongoose.connection.on('error', (err) => {
  console.error('MongoDB background connection error:', err.message);
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    console.warn('WARNING: Running backend in degraded mode (in-memory database fallback).');
  });

app.listen(PORT, () => {
  console.log(`My Day unified backend listening on port ${PORT}`);
});

export default app;
