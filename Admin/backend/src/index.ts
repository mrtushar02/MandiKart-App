import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { getValidatedEnv } from '@mandikart/shared-config';
import { requireIdempotency } from '@mandikart/shared-core';
import { adminRouter } from './routes/admin.routes.js';

const env = getValidatedEnv();
const app = express();
const PORT = env.ADMIN_BACKEND_PORT || 4003;

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
app.use(requireIdempotency);

// Health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    data: {
      service: 'mandikart-admin-backend',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      port: PORT,
    },
    meta: null,
    error: null,
  });
});

// Admin Routes
app.use('/api/v1/admin', adminRouter);

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error in Admin Backend:', err);
  res.status(500).json({
    data: null,
    meta: null,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
});

app.listen(PORT, () => {
  console.log(`🛡️ MandiKart Admin Backend running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
});

export default app;
