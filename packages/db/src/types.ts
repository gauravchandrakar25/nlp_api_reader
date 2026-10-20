export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type RiskLevel = 'read_only' | 'idempotent_write' | 'destructive';
export type AuthType = 'bearer' | 'api_key' | 'basic' | 'header' | 'none';

export interface ParamDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  location: 'path' | 'query' | 'body' | 'header';
  default?: any;
  required?: boolean;
}

export interface ApiProvider {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_url: string;
  auth_type: AuthType;
  auth_header_name: string;
  auth_header_prefix: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EndpointTemplate {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  category: string;
  http_method: HttpMethod;
  path_template: string;
  required_params: ParamDefinition[];
  optional_params: ParamDefinition[];
  headers_template: Record<string, string>;
  default_body_template?: Record<string, any> | null;
  sample_queries: string[];
  risk_level: RiskLevel;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined provider metadata when queried
  provider?: Pick<ApiProvider, 'name' | 'slug' | 'base_url' | 'auth_type'>;
}

export interface AuditLog {
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
  response_preview?: any;
  created_at: string;
}

export interface IntentMatchResult {
  matchedEndpoint: EndpointTemplate | null;
  parsedParams: Record<string, any>;
  confidence: number;
  reasoning: string;
  missingRequiredParams?: string[];
}

export interface ExecuteNlRequest {
  query: string;
  userIdentifier?: string;
  overrideParams?: Record<string, any>;
  context?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  httpStatus: number;
  latencyMs: number;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>; // Sanitized - no secrets
  params: Record<string, any>;
  data: any;
  matchedTemplate: {
    id: string;
    name: string;
    category: string;
    riskLevel: RiskLevel;
    confidence: number;
    reasoning: string;
  };
  auditLogId?: string;
  error?: string;
}
