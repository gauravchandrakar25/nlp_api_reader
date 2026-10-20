import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { executeRouter } from './routes/execute';
import { endpointsRouter } from './routes/endpoints';
import { isSupabaseConfigured } from '@rea/db';

export function createServer(): Express {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: '*', // Allows access from web client and dev environments
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );
  app.use(express.json());

  // Request logger
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Healthcheck endpoint for Railway deployment
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      supabaseConnected: isSupabaseConfigured(),
      service: 'rea-api-gateway',
    });
  });

  // API Routes
  app.use('/api', executeRouter);
  app.use('/api', endpointsRouter);

  // 404 Fallback
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[API Unhandled Error]:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    });
  });

  return app;
}
