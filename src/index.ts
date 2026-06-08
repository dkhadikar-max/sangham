import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { ensureUploadDirs } from './services/storage';

// v1 routes
import authRoutes         from './routes/auth';
import userRoutes         from './routes/users';
import postRoutes         from './routes/posts';
import libraryRoutes      from './routes/library';
import sessionRoutes      from './routes/sessions';
import eventRoutes        from './routes/events';
import assocRoutes        from './routes/associations';
import messageRoutes      from './routes/messages';
import adminRoutes        from './routes/admin';
import uploadRoutes        from './routes/uploads';
// v2 extension routes
import discoverRoutes     from './routes/discover';
import intentRoutes       from './routes/intents';
import privacyRoutes      from './routes/privacy';
import contributionRoutes from './routes/contributions';
import teacherRoutes      from './routes/teachers';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://sangham.online',
  'https://www.sangham.online',
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
];

const app = express();
const httpServer = createServer(app);

export const io = new SocketServer(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});

io.on('connection', (socket) => {
  socket.on('join_room',    (roomId: string) => socket.join(roomId));
  socket.on('leave_room',   (roomId: string) => socket.leave(roomId));
  socket.on('chat_message', (data: { roomId: string; message: string; userId: string }) => {
    socket.to(data.roomId).emit('chat_message', data);
  });
});

// Railway (and most cloud platforms) front requests with a proxy.
// Without this, express-rate-limit sees every user as the same IP.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, cb) => {
    // allow no-origin (mobile apps, curl, same-origin requests)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));
app.use(apiLimiter);

// ── Serve frontend (sangham.html → public/index.html) ──────────────────────
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// ── Local file serving ──────────────────────────────────────────────────────
const uploadsPath = path.resolve(env.UPLOADS_DIR);
ensureUploadDirs();
app.use('/uploads', express.static(uploadsPath));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sangham-api', version: '0.2.0', timestamp: new Date().toISOString() });
});

const API = `/api/${env.API_VERSION}`;
// Core
app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/users`,         userRoutes);
app.use(`${API}/posts`,         postRoutes);
app.use(`${API}/library`,       libraryRoutes);
app.use(`${API}/sessions`,      sessionRoutes);
app.use(`${API}/events`,        eventRoutes);
app.use(`${API}/associations`,  assocRoutes);
app.use(`${API}/messages`,      messageRoutes);
app.use(`${API}/admin`,         adminRoutes);
// Extensions
app.use(`${API}/discover`,      discoverRoutes);
app.use(`${API}/intents`,       intentRoutes);
app.use(`${API}/privacy`,       privacyRoutes);
app.use(`${API}/contributions`, contributionRoutes);
app.use(`${API}/teachers`,      teacherRoutes);
app.use(`${API}/uploads`,       uploadRoutes);

// ── SPA fallback — serve index.html for all non-API routes ─────────────────
app.get('*', (_req, res) => {
  const indexFile = path.join(__dirname, '..', 'public', 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) res.status(404).json({ error: 'Route not found' });
  });
});

app.use(errorHandler);

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis().catch(() => console.warn('⚠️  Redis unavailable'));
  httpServer.listen(env.PORT, () => {
    console.log(`\n🙏 Sangham API v0.2.0`);
    console.log(`   ├─ http://localhost:${env.PORT}/health`);
    console.log(`   └─ http://localhost:${env.PORT}/api/${env.API_VERSION}\n`);
  });
}

bootstrap().catch((err) => { console.error('Fatal:', err); process.exit(1); });
export default app;
