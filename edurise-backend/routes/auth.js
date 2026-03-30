import express from 'express';
import { login, me, register } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);

// Login
router.post('/login', login);

// Get current user
router.get('/me', me);

export default router;