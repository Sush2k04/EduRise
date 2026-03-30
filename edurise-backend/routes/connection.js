import express from 'express';
import { auth } from '../config/middleware/auth.js';
import { acceptRequest, getMyConnections, rejectRequest, sendRequest, removeConnection } from '../controllers/connectionController.js';

const router = express.Router();

// Send connection request
router.post('/request/:userId', auth, sendRequest);

// Accept request
router.put('/accept/:requestId', auth, acceptRequest);

// Reject request
router.put('/reject/:requestId', auth, rejectRequest);

// Remove connection (unfriend)
router.delete('/remove/:userId', auth, removeConnection);

// List my connections + pending
router.get('/me', auth, getMyConnections);

export default router;

