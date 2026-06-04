import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes      from './routes/auth';
import userRoutes      from './routes/users';
import postRoutes      from './routes/posts';
import libraryRoutes   from './routes/library';
import sessionRoutes   from './routes/sessions';
import eventRoutes     from './routes/events';
import assocRoutes     from './routes/associations';
import messageRoutes   from './routes/messages';
import adminRoutes     from './routes/admin';

const app = express();
const httpServer = createServer(app);

// ── Socket.io (real-time DMs + live session chat) ─────────────────────
export const io = new SocketServer(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true },
});

io.on('connection', (socket) => {
  socket.on('join_room', (roomId: string) => socket.join(roomId));
  socket.on('leave_room', (roomId: string) => socket.leave(roomId));
  socket.on('chat_message', (data: { roomId: string; message: string; userId: string }) => {
    socket.to(data.roomId).emit('chat_message', data);
  });
});

// ── Global Middleware ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));
app.use(apiLimiter);

// ── Health check ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sangham-api', version: '0.1.0', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────
const API = `/api/${env.API_VERSION}`;
app.use(`${API}/auth`,         authRoutes);
app.use(`${API}/users`,        userRoutes);
app.use(`${API}/posts`,        postRoutes);
app.use(`${API}/library`,      libraryRoutes);
app.use(`${API}/sessions`,     sessionRoutes);
app.use(`${API}/events`,       eventRoutes);
app.use(`${API}/associations`, assocRoutes);
app.use(`${API}/messages`,     messageRoutes);
app.use(`${API}/admin`,        adminRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler (must be last)
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis().catch(() => console.warn('⚠️  Redis unavailable — cache disabled'));

  httpServer.listen(env.PORT, () => {
    console.log(`\n🙏 Sangham API running`);
    console.log(`   ├─ http://localhost:${env.PORT}/health`);
    console.log(`   ├─ http://localhost:${env.PORT}/api/${env.API_VERSION}`);
    console.log(`   └─ Environment: ${env.NODE_ENV}\n`);
  });
}

bootstrap().catch((err) => { console.error('Fatal startup error:', err); process.exit(1); });

export default app;
