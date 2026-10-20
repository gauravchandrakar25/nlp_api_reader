import { createAuditLog, AuditLog } from '@rea/db';
import { ExecutedResponse } from './executor';
import { EndpointTemplate } from '@rea/db';

export async function logExecutionAudit(
  query: string,
  userIdentifier: string,
  endpoint: EndpointTemplate | null,
  execution: ExecutedResponse | null,
  error?: string
): Promise<AuditLog> {
  const auditEntry = await createAuditLog({
    endpoint_template_id: endpoint?.id || null,
    user_identifier: userIdentifier || 'anonymous_pm',
    natural_language_query: query,
    matched_endpoint_name: endpoint?.name || null,
    resolved_method: execution?.method || endpoint?.http_method || 'UNKNOWN',
    resolved_url: execution?.url || 'unresolved',
    injected_params: execution?.resolvedParams || {},
    http_status: execution?.httpStatus || (error ? 500 : 404),
    execution_time_ms: execution?.latencyMs || 0,
    success: execution?.success ?? false,
    error_message: error || execution?.error || null,
    response_preview: execution?.data ? summarizeResponse(execution.data) : null,
  });

  return auditEntry;
}

function summarizeResponse(data: any): any {
  if (!data) return null;
  if (Array.isArray(data)) {
    return { count: data.length, sample: data.slice(0, 2) };
  }
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    return {
      keys: keys.slice(0, 10),
      objectType: data.object || data.status || 'record',
    };
  }
  return String(data).substring(0, 100);
}
