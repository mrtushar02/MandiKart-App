import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { getValidatedEnv } from '@mandikart/shared-config';
import { tasksRouter } from './routes/tasks.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { notificationsRouter } from './routes/notifications.routes.js';
import { earningsRouter } from './routes/earnings.routes.js';
import { locationRouter } from './routes/location.routes.js';
import { fleetRouter } from './routes/fleet.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { createServer } from 'http';
import { SocketService } from './services/socket.service.js';
import { DispatchService } from './services/dispatch.service.js';

dotenv.config();

const env = getValidatedEnv();
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io Server
SocketService.init(httpServer);

// Initialize Auto-Dispatch Cron
DispatchService.startAutoDispatchCron();

const PORT = env.LOGISTIC_BACKEND_PORT || 4002;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  const isMock = !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder');
  res.status(200).json({
    data: {
      service: 'mandikart-logistic-backend',
      status: 'healthy',
      mode: isMock ? 'MOCK' : 'SUPABASE',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '2.0.0',
      port: PORT,
      endpoints: [
        '/api/v1/tasks',
        '/api/v1/profile',
        '/api/v1/notifications',
        '/api/v1/earnings',
        '/api/v1/location',
        '/api/v1/fleet',
      ],
    },
    meta: null,
    error: null,
  });
});

// Auth Routes (shared with User App, Farmer App, Admin)
app.use('/api/v1/auth', authRouter);

// Logistics Partner Routes
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/earnings', earningsRouter);
app.use('/api/v1/location', locationRouter);
app.use('/api/v1/fleet', fleetRouter);

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error in Logistic Backend:', err);
  res.status(500).json({
    data: null,
    meta: null,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Logistic Service (with WebSockets) running on port ${PORT} (0.0.0.0)`);
  console.log(`🔌 Mode: ${!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder') ? 'MOCK/MEMORY' : 'SUPABASE CONNECTED'}`);
});

export default app;
