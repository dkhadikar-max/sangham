import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';

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
import dhammaDaanRoutes   from './routes/dhammaDaan';
import projectRoutes      from './routes/projects';
import resourceRoutes     from './routes/resources';
import courseRoutes       from './routes/courses';
import studyCircleRoutes  from './routes/studyCircles';
import discussionRoutes   from './routes/discussions';
import notificationRoutes from './routes/notifications';
import educateRoutes      from './routes/educate';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://sangham.online',
  'https://www.sangham.online',
  'https://app.sangham.online',
  ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim()) : []),
];

const app = express();
const httpServer = createServer(app);

export const io = new SocketServer(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});

// Require a valid JWT on every WebSocket connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) return next(new Error('Authentication required'));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    socket.data.userId = payload.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId as string; // server-verified, never trust client claim
  socket.on('join_room',    (roomId: string) => socket.join(roomId));
  socket.on('leave_room',   (roomId: string) => socket.leave(roomId));
  // Inject server-verified userId — client-supplied userId is ignored; iv forwarded for E2E decryption
  socket.on('chat_message', (data: { roomId: string; message: string; iv?: string }) => {
    socket.to(data.roomId).emit('chat_message', { ...data, userId });
  });
});

// Railway (and most cloud platforms) front requests with a proxy.
// Without this, express-rate-limit sees every user as the same IP.
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      // Inline script block + onclick handlers + Socket.IO CDN
      scriptSrc:     ["'self'", "'unsafe-inline'", 'https://cdn.socket.io', 'https://static.cloudflareinsights.com', 'https://checkout.razorpay.com', 'https://cdn.tailwindcss.com', 'https://cdnjs.cloudflare.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      // Inline <style> blocks + Google Fonts CSS
      styleSrc:      ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc:       ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      // Same-origin fetches + WebSocket (Socket.IO) + socket.io source maps (devtools)
      connectSrc:    ["'self'", 'wss:', 'ws:', 'https://cdn.socket.io'],
      imgSrc:        ["'self'", 'data:', 'blob:', 'https://covers.openlibrary.org', 'https://images.unsplash.com', 'https://archive.org', 'https://books.google.com'],
      mediaSrc:      ["'self'", 'blob:'],
      frameSrc:      ["'self'", 'https://drive.google.com'],
    },
  },
}));
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
app.use(`${API}/dhamma-daan`,   dhammaDaanRoutes);
app.use(`${API}/projects`,      projectRoutes);
app.use(`${API}/resources`,     resourceRoutes);
app.use(`${API}/courses`,       courseRoutes);
app.use(`${API}/study-circles`, studyCircleRoutes);
app.use(`${API}/discussions`,   discussionRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/uploads`,       uploadRoutes);
app.use(`${API}/educate`,       educateRoutes);

// ── Admin panel (separate route, before SPA fallback) ──────────────────────
app.get('/admin', (_req, res) => {
  const adminFile = path.join(__dirname, '..', 'public', 'admin.html');
  res.sendFile(adminFile, (err) => {
    if (err) res.status(404).json({ error: 'Admin panel not found' });
  });
});

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
