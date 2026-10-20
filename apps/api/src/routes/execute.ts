import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAvailableEndpoints } from '@rea/db';
import { matchIntentToEndpoint } from '../services/llmRouter';
import { injectAuthAndExecute } from '../services/executor';
import { logExecutionAudit } from '../services/auditLogger';

export const executeRouter = Router();

const executeNlSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  userIdentifier: z.string().optional().default('product_manager_guest'),
  overrideParams: z.record(z.any()).optional().default({}),
  endpointId: z.string().optional(), // Direct template execution option
});

/**
 * POST /api/execute-nl
 * Translates PM natural language into a secure API call using whitelisted templates
 */
executeRouter.post('/execute-nl', async (req: Request, res: Response): Promise<void> => {
  const parseResult = executeNlSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid request body',
      details: parseResult.error.flatten(),
    });
    return;
  }

  const { query, userIdentifier, overrideParams, endpointId } = parseResult.data;

  try {
    // 1. Fetch available authorized endpoint templates from Supabase
    const availableEndpoints = await getAvailableEndpoints();

    let matchedEndpoint = null;
    let parsedParams: Record<string, any> = { ...overrideParams };
    let confidence = 100;
    let reasoning = '';

    if (endpointId) {
      // Direct template selection
      matchedEndpoint = availableEndpoints.find((ep) => ep.id === endpointId) || null;
      if (!matchedEndpoint) {
        res.status(404).json({
          success: false,
          error: `Endpoint template ID "${endpointId}" not found`,
        });
        return;
      }
      reasoning = `Directly executed endpoint template: ${matchedEndpoint.name}`;
    } else {
      // 2. LLM Intent Matching Stub
      const intentResult = await matchIntentToEndpoint(query, availableEndpoints, overrideParams);
      matchedEndpoint = intentResult.matchedEndpoint;
      parsedParams = intentResult.parsedParams;
      confidence = intentResult.confidence;
      reasoning = intentResult.reasoning;
    }

    if (!matchedEndpoint) {
      await logExecutionAudit(query, userIdentifier, null, null, 'No matching endpoint template found');
      res.status(404).json({
        success: false,
        error: 'Unable to match intent to an approved API endpoint.',
        confidence,
        reasoning,
        suggestedEndpoints: availableEndpoints.slice(0, 4).map((ep) => ({
          id: ep.id,
          name: ep.name,
          category: ep.category,
          sampleQueries: ep.sample_queries,
        })),
      });
      return;
    }

    // 3. Inject Authentication & Execute API Call securely
    const execution = await injectAuthAndExecute(matchedEndpoint, parsedParams);

    // 4. Record Audit Log in Supabase
    const auditRecord = await logExecutionAudit(query, userIdentifier, matchedEndpoint, execution);

    // 5. Respond to frontend (Zero Secrets Expose)
    res.status(execution.success ? 200 : execution.httpStatus || 500).json({
      success: execution.success,
      httpStatus: execution.httpStatus,
      latencyMs: execution.latencyMs,
      url: execution.url,
      method: execution.method,
      headers: execution.sanitizedHeaders, // Safe, redacted headers
      params: execution.resolvedParams,
      data: execution.data,
      matchedTemplate: {
        id: matchedEndpoint.id,
        name: matchedEndpoint.name,
        category: matchedEndpoint.category,
        riskLevel: matchedEndpoint.risk_level,
        providerName: matchedEndpoint.provider?.name || 'External API',
        confidence,
        reasoning,
      },
      auditLogId: auditRecord.id,
    });
  } catch (error: any) {
    console.error('[ExecuteNL] Execution error:', error);
    await logExecutionAudit(query, userIdentifier, null, null, error.message);

    res.status(500).json({
      success: false,
      error: 'An unexpected internal error occurred while executing the API request',
      message: error.message,
    });
  }
});
