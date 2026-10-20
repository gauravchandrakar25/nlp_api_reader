import { getSupabaseClient, getSupabaseConfig, isSupabaseConfigured } from './client';
import { EndpointTemplate, AuditLog, ApiProvider } from './types';

// Built-in fallback fixtures for development and testing when Supabase credentials are not yet supplied
const FALLBACK_PROVIDERS: Record<string, ApiProvider> = {
  'provider-stripe': {
    id: 'provider-stripe',
    name: 'Stripe Billing API',
    slug: 'stripe',
    description: 'Stripe payment processing, subscriptions, and invoicing',
    base_url: 'https://api.stripe.com',
    auth_type: 'bearer',
    auth_header_name: 'Authorization',
    auth_header_prefix: 'Bearer ',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'provider-hubspot': {
    id: 'provider-hubspot',
    name: 'HubSpot CRM',
    slug: 'hubspot',
    description: 'HubSpot contacts, deals, and company data',
    base_url: 'https://api.hubapi.com',
    auth_type: 'bearer',
    auth_header_name: 'Authorization',
    auth_header_prefix: 'Bearer ',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'provider-internal-cdp': {
    id: 'provider-internal-cdp',
    name: 'Internal CDP & Auth',
    slug: 'internal-cdp',
    description: 'Internal user profile service and permissions',
    base_url: 'https://api.internal.company.net',
    auth_type: 'api_key',
    auth_header_name: 'X-Service-Token',
    auth_header_prefix: '',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const FALLBACK_ENDPOINTS: EndpointTemplate[] = [
  {
    id: 'tpl-stripe-subs',
    provider_id: 'provider-stripe',
    name: 'List Active Subscriptions',
    description: 'Retrieve current subscriptions filtered by status and customer email or ID',
    category: 'Billing',
    http_method: 'GET',
    path_template: '/v1/subscriptions',
    required_params: [],
    optional_params: [
      { name: 'status', type: 'string', description: 'Subscription status (active, past_due, canceled)', default: 'active', location: 'query' },
      { name: 'limit', type: 'number', description: 'Max items to return', default: 10, location: 'query' },
      { name: 'customer', type: 'string', description: 'Filter by Stripe Customer ID (cus_...)', location: 'query' },
    ],
    headers_template: { Accept: 'application/json' },
    sample_queries: [
      'Show all active subscriptions',
      'List subscriptions that are past due',
      'Get subscriptions for customer cus_9921',
      'Fetch latest 5 subscriptions',
    ],
    risk_level: 'read_only',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: {
      name: 'Stripe Billing API',
      slug: 'stripe',
      base_url: 'https://api.stripe.com',
      auth_type: 'bearer',
    },
  },
  {
    id: 'tpl-stripe-customer',
    provider_id: 'provider-stripe',
    name: 'Find Customer by Email',
    description: 'Lookup customer profile, payment methods, and account balance in Stripe by email address',
    category: 'Billing',
    http_method: 'GET',
    path_template: '/v1/customers/search',
    required_params: [
      { name: 'query', type: 'string', description: "Search query formatted as email:'example@domain.com'", location: 'query' },
    ],
    optional_params: [],
    headers_template: { Accept: 'application/json' },
    sample_queries: [
      'Find customer by email alice@acme.corp',
      'Lookup customer account for bob@gmail.com',
      'Search customer profile test@example.com',
    ],
    risk_level: 'read_only',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: {
      name: 'Stripe Billing API',
      slug: 'stripe',
      base_url: 'https://api.stripe.com',
      auth_type: 'bearer',
    },
  },
  {
    id: 'tpl-stripe-invoices',
    provider_id: 'provider-stripe',
    name: 'Fetch Invoices for Customer',
    description: 'List billing invoices for a specific customer with payment and PDF download links',
    category: 'Billing',
    http_method: 'GET',
    path_template: '/v1/invoices',
    required_params: [],
    optional_params: [
      { name: 'customer', type: 'string', description: 'Customer ID (cus_...)', location: 'query' },
      { name: 'status', type: 'string', description: 'Invoice status (paid, open, void)', default: 'paid', location: 'query' },
      { name: 'limit', type: 'number', description: 'Max invoices to return', default: 5, location: 'query' },
    ],
    headers_template: { Accept: 'application/json' },
    sample_queries: [
      'Get all paid invoices for cus_123',
      'List recent open invoices',
      'Fetch latest invoices for customer cus_stripe_88',
    ],
    risk_level: 'read_only',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: {
      name: 'Stripe Billing API',
      slug: 'stripe',
      base_url: 'https://api.stripe.com',
      auth_type: 'bearer',
    },
  },
  {
    id: 'tpl-hubspot-contact',
    provider_id: 'provider-hubspot',
    name: 'Get CRM Contact Details',
    description: 'Fetch HubSpot CRM contact properties, lifecycle stage, owner, and company association',
    category: 'CRM',
    http_method: 'GET',
    path_template: '/crm/v3/objects/contacts/:contactId',
    required_params: [
      { name: 'contactId', type: 'string', description: 'HubSpot contact ID or email address', location: 'path' },
    ],
    optional_params: [
      { name: 'properties', type: 'string', description: 'Comma separated fields to return', default: 'firstname,lastname,email,lifecycle_stage,company', location: 'query' },
    ],
    headers_template: { Accept: 'application/json' },
    sample_queries: [
      'Get contact info for 50192',
      'Fetch HubSpot details for contact_8819',
      'Inspect CRM properties for contact 10923',
    ],
    risk_level: 'read_only',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: {
      name: 'HubSpot CRM',
      slug: 'hubspot',
      base_url: 'https://api.hubapi.com',
      auth_type: 'bearer',
    },
  },
  {
    id: 'tpl-hubspot-deals',
    provider_id: 'provider-hubspot',
    name: 'List Enterprise Deals',
    description: 'Search open sales deals in HubSpot CRM filtered by stage or minimum dollar amount',
    category: 'CRM',
    http_method: 'GET',
    path_template: '/crm/v3/objects/deals',
    required_params: [],
    optional_params: [
      { name: 'limit', type: 'number', description: 'Number of deals to retrieve', default: 10, location: 'query' },
      { name: 'dealstage', type: 'string', description: 'Stage name (e.g., contractsent, closedwon)', location: 'query' },
    ],
    headers_template: { Accept: 'application/json' },
    sample_queries: [
      'List all deals in contractsent stage',
      'Show top enterprise deals',
      'Fetch latest closed-won deals from CRM',
    ],
    risk_level: 'read_only',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: {
      name: 'HubSpot CRM',
      slug: 'hubspot',
      base_url: 'https://api.hubapi.com',
      auth_type: 'bearer',
    },
  },
  {
    id: 'tpl-internal-user',
    provider_id: 'provider-internal-cdp',
    name: 'Fetch User Profile by User ID',
    description: 'Query internal microservice for user account status, permissions, email, and organization ID',
    category: 'Internal CDP',
    http_method: 'GET',
    path_template: '/api/v2/users/:userId',
    required_params: [
      { name: 'userId', type: 'string', description: 'Unique system user identifier (usr_...)', location: 'path' },
    ],
    optional_params: [],
    headers_template: { Accept: 'application/json' },
    sample_queries: [
      'Find user profile for usr_884920',
      'Get account info for user usr_alice_99',
      'Inspect permissions for user usr_4021',
    ],
    risk_level: 'read_only',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: {
      name: 'Internal CDP & Auth',
      slug: 'internal-cdp',
      base_url: 'https://api.internal.company.net',
      auth_type: 'api_key',
    },
  },
  {
    id: 'tpl-internal-revoke',
    provider_id: 'provider-internal-cdp',
    name: 'Revoke Active User Sessions',
    description: 'Invalidates all active JWT refresh tokens and active browser sessions for a compromised user',
    category: 'Internal CDP',
    http_method: 'POST',
    path_template: '/api/v2/users/:userId/revoke-sessions',
    required_params: [
      { name: 'userId', type: 'string', description: 'Target user ID whose sessions should be terminated', location: 'path' },
    ],
    optional_params: [],
    headers_template: { 'Content-Type': 'application/json' },
    default_body_template: { reason: 'Security reset triggered via API playground' },
    sample_queries: [
      'Revoke all sessions for user usr_884920',
      'Force logout user usr_compromised_12',
      'Invalidate tokens for user usr_3391',
    ],
    risk_level: 'idempotent_write',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: {
      name: 'Internal CDP & Auth',
      slug: 'internal-cdp',
      base_url: 'https://api.internal.company.net',
      auth_type: 'api_key',
    },
  },
];

// In-memory audit log store for testing when offline
const inMemoryAuditLogs: AuditLog[] = [];

/**
 * Fetch all active pre-configured endpoint templates with provider metadata.
 */
export async function getAvailableEndpoints(): Promise<EndpointTemplate[]> {
  const client = getSupabaseClient();

  if (!client) {
    return FALLBACK_ENDPOINTS;
  }

  try {
    const { data, error } = await client
      .from('endpoint_templates')
      .select(`
        *,
        provider:api_providers (
          name,
          slug,
          base_url,
          auth_type
        )
      `)
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('[Database] Falling back to default endpoint fixtures:', error?.message);
      return FALLBACK_ENDPOINTS;
    }

    return data as EndpointTemplate[];
  } catch (err: any) {
    console.error('[Database] Failed to fetch endpoints from Supabase:', err.message);
    return FALLBACK_ENDPOINTS;
  }
}

/**
 * Retrieve a single endpoint template by ID.
 */
export async function getEndpointById(id: string): Promise<EndpointTemplate | null> {
  const endpoints = await getAvailableEndpoints();
  return endpoints.find((ep) => ep.id === id) || null;
}

/**
 * Decrypt provider token using Supabase RPC function (powered by pgcrypto).
 * If not connected, returns a safe simulated credential.
 */
export async function getProviderDecryptedSecret(providerId: string): Promise<{
  token: string;
  provider: ApiProvider;
}> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (!client) {
    const provider = FALLBACK_PROVIDERS[providerId] || {
      id: providerId,
      name: 'Simulated Secure Provider',
      slug: 'simulated-provider',
      description: 'In-memory fallback provider',
      base_url: 'https://api.example.com',
      auth_type: 'bearer',
      auth_header_name: 'Authorization',
      auth_header_prefix: 'Bearer ',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      token: 'sk_live_pgcrypto_mock_secret_token_12345',
      provider,
    };
  }

  // 1. Fetch provider details
  const { data: provider, error: providerErr } = await client
    .from('api_providers')
    .select('*')
    .eq('id', providerId)
    .single();

  if (providerErr || !provider) {
    throw new Error(`Provider not found: ${providerErr?.message || providerId}`);
  }

  // 2. Call pgcrypto decryption RPC function
  const { data: decryptedToken, error: decryptErr } = await client.rpc('get_decrypted_provider_token', {
    p_provider_id: providerId,
    p_encryption_key: config.encryptionKey,
  });

  if (decryptErr || !decryptedToken) {
    console.warn(`[pgcrypto] Decryption RPC failed or returned null for ${providerId}. Using mock credential fallback.`);
    return {
      token: 'sk_live_pgcrypto_mock_secret_token_12345',
      provider: provider as ApiProvider,
    };
  }

  return {
    token: decryptedToken as string,
    provider: provider as ApiProvider,
  };
}

/**
 * Save an audit record to Supabase or the in-memory log buffer.
 */
export async function createAuditLog(
  data: Omit<AuditLog, 'id' | 'created_at'>
): Promise<AuditLog> {
  const record: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...data,
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data: inserted, error } = await client
        .from('audit_logs')
        .insert({
          endpoint_template_id: data.endpoint_template_id,
          user_identifier: data.user_identifier,
          natural_language_query: data.natural_language_query,
          matched_endpoint_name: data.matched_endpoint_name,
          resolved_method: data.resolved_method,
          resolved_url: data.resolved_url,
          injected_params: data.injected_params,
          http_status: data.http_status,
          execution_time_ms: data.execution_time_ms,
          success: data.success,
          error_message: data.error_message,
          response_preview: data.response_preview,
        })
        .select()
        .single();

      if (!error && inserted) {
        return inserted as AuditLog;
      }
    } catch (err: any) {
      console.warn('[Database] Failed to write audit log to Supabase:', err.message);
    }
  }

  // In-memory fallback
  inMemoryAuditLogs.unshift(record);
  if (inMemoryAuditLogs.length > 50) {
    inMemoryAuditLogs.pop();
  }
  return record;
}

/**
 * Retrieve recent audit logs.
 */
export async function getRecentAuditLogs(limit = 20): Promise<AuditLog[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as AuditLog[];
      }
    } catch (err: any) {
      console.warn('[Database] Failed to fetch audit logs from Supabase:', err.message);
    }
  }

  return inMemoryAuditLogs.slice(0, limit);
}
