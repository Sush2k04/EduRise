import express from 'express';
import { auth } from '../config/middleware/auth.js';
import { listMyNotifications, markAllRead, markRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/me', auth, listMyNotifications);
router.put('/:id/read', auth, markRead);
router.put('/read-all', auth, markAllRead);

export default router;

