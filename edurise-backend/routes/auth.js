import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword 
    });

    // Create empty profile
    await Profile.create({ user: user._id });

    // Generate JWT token
    const payload = { 
      user: { 
        id: user._id 
      } 
    };
    
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: '12h' }
    );

    // Return user data (excluding password)
    res.status(201).json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        tokens: user.tokens,
        rating: user.rating
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload = { 
      user: { 
        id: user._id 
      } 
    };
    
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: '12h' }
    );

    // Return user data (excluding password)
    res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        tokens: user.tokens,
        rating: user.rating
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;