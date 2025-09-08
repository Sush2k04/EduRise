import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import matchRoutes from './routes/match.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB(process.env.MONGO_URI);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/match', matchRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'EduRise API Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      match: '/api/match'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});