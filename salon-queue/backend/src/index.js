// src/index.js
// Express + Socket.IO server entry point.

import './config/env.js'; // Validate env vars first
import { env } from './config/env.js';

import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';

import { initSocket } from './lib/socket.js';
import { buildPublicQueueState } from './services/publicState.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes     from './routes/auth.js';
import queueRoutes    from './routes/queue.js';
import barberRoutes   from './routes/barbers.js';
import serviceRoutes  from './routes/services.js';
import adminRoutes    from './routes/admin.js';

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();

// CORS: allow configured frontend URL(s)
const allowedOrigins = env.FRONTEND_URL.split(',').map((u) => u.trim());
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, same-origin) in dev
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed.`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/queue',    queueRoutes);
app.use('/api/barbers',  barberRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin',    adminRoutes);

// 404 for unknown API routes
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));

// Global error handler (must be last)
app.use(errorHandler);

// ── HTTP server + Socket.IO ───────────────────────────────────────────────────

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
  // Ping to detect disconnections
  pingTimeout:  10_000,
  pingInterval: 25_000,
});

initSocket(io);

// ── Socket.IO connection handling ─────────────────────────────────────────────

io.on('connection', async (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // Send current state immediately on connect so client can hydrate
  try {
    const state = await buildPublicQueueState();
    socket.emit('queue:updated', state);
  } catch (err) {
    console.error('[socket] initial state error:', err.message);
  }

  // Customer subscribes to private entry updates by UUID
  socket.on('subscribe:entry', (entryId) => {
    if (typeof entryId === 'string' && entryId.length === 36) {
      socket.join(`entry:${entryId}`);
    }
  });

  socket.on('unsubscribe:entry', (entryId) => {
    socket.leave(`entry:${entryId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

// ── Periodic wait-time recompute broadcast (every 30 s) ───────────────────────
setInterval(async () => {
  try {
    const state = await buildPublicQueueState();
    io.emit('queue:updated', state);
  } catch (err) {
    console.error('[periodic] broadcast error:', err.message);
  }
}, 30_000);

// ── Start server ──────────────────────────────────────────────────────────────

server.listen(env.PORT, () => {
  console.log(`\n🚀  Salon Queue backend running on port ${env.PORT}`);
  console.log(`    ENV: ${env.NODE_ENV}`);
  console.log(`    CORS: ${allowedOrigins.join(', ')}`);
  console.log(`    Health: http://localhost:${env.PORT}/health\n`);
});
