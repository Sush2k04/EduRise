import express from 'express';
import { auth } from '../config/middleware/auth.js';
<<<<<<< HEAD
import { acceptRequest, getMyConnections, rejectRequest, sendRequest } from '../controllers/connectionController.js';
=======
import { acceptRequest, getMyConnections, rejectRequest, sendRequest, removeConnection } from '../controllers/connectionController.js';
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57

const router = express.Router();

// Send connection request
router.post('/request/:userId', auth, sendRequest);

// Accept request
router.put('/accept/:requestId', auth, acceptRequest);

// Reject request
router.put('/reject/:requestId', auth, rejectRequest);

<<<<<<< HEAD
=======
// Remove connection (unfriend)
router.delete('/remove/:userId', auth, removeConnection);

>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
// List my connections + pending
router.get('/me', auth, getMyConnections);

export default router;

