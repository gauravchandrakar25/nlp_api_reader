export interface EndpointTemplate {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  category: string;
  http_method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path_template: string;
  required_params: Array<{
    name: string;
    type: string;
    description: string;
    location: string;
    default?: any;
  }>;
  optional_params: Array<{
    name: string;
    type: string;
    description: string;
    location: string;
    default?: any;
  }>;
  headers_template: Record<string, string>;
  sample_queries: string[];
  risk_level: 'read_only' | 'idempotent_write' | 'destructive';
  provider?: {
    name: string;
    slug: string;
    base_url: string;
    auth_type: string;
  };
}

export interface ExecutionResult {
  success: boolean;
  httpStatus: number;
  latencyMs: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  params: Record<string, any>;
  data: any;
  matchedTemplate: {
    id: string;
    name: string;
    category: string;
    riskLevel: string;
    providerName?: string;
    confidence: number;
    reasoning: string;
  };
  auditLogId?: string;
  error?: string;
}

export interface AuditRecord {
  id: string;
  endpoint_template_id: string | null;
  user_identifier: string;
  natural_language_query: string;
  matched_endpoint_name: string | null;
  resolved_method: string;
  resolved_url: string;
  injected_params: Record<string, any>;
  http_status: number | null;
  execution_time_ms: number | null;
  success: boolean;
  error_message?: string | null;
  created_at: string;
}
