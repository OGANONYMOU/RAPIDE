import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { logger } from './config/logger';
import { prisma } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import driverRoutes from './modules/drivers/drivers.routes';
import orderRoutes from './modules/orders/orders.routes';
import pricingRoutes from './modules/pricing/pricing.routes';
import paymentRoutes from './modules/payments/payments.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import businessRoutes from './modules/businesses/businesses.routes';
import adminRoutes from './modules/admin/admin.routes';
import trackingRoutes from './modules/tracking/tracking.routes';
import supportRoutes from './modules/support/support.routes';

// Socket handler
import { initSocketHandlers } from './services/socket.service';

const app = express();
const httpServer = createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

initSocketHandlers(io);

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// ─── Static Files (uploads) ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'rapide-api', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/drivers`, driverRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/pricing`, pricingRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/businesses`, businessRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/tracking`, trackingRoutes);
app.use(`${API_PREFIX}/support`, supportRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Server Start ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 4000;

httpServer.listen(PORT, async () => {
  logger.info(`🚀 Rapide API running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { io };
