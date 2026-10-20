import { Router, Request, Response } from 'express';
import { getAvailableEndpoints, getRecentAuditLogs } from '@rea/db';

export const endpointsRouter = Router();

/**
 * GET /api/endpoints
 * Returns all active pre-configured endpoint templates for the sidebar
 */
endpointsRouter.get('/endpoints', async (_req: Request, res: Response): Promise<void> => {
  try {
    const endpoints = await getAvailableEndpoints();
    res.json({
      success: true,
      data: endpoints,
      total: endpoints.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to load endpoint templates',
      message: err.message,
    });
  }
});

/**
 * GET /api/audit-logs
 * Returns recent execution audit records for compliance and history
 */
endpointsRouter.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const logs = await getRecentAuditLogs(limit);
    res.json({
      success: true,
      data: logs,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to load audit logs',
      message: err.message,
    });
  }
});
