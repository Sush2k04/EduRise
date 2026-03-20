import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import matchRoutes from './routes/match.js';
import sessionRoutes from './routes/session.js';
import connectionRoutes from './routes/connection.js';
import tddsRoutes from './routes/tdds.js';
import notificationRoutes from './routes/notification.js';
import { registerSocketHandlers } from './sockets/index.js';
import { setIO } from './sockets/io.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edurise';
await connectDB(MONGO_URI);

app.get('/', (req, res) => {
  res.send('EduRise API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/connection', connectionRoutes);
app.use('/api/tdds', tddsRoutes);
app.use('/api/notification', notificationRoutes);

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

setIO(io);
registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
