-- ============================================================================
-- Seed Data for API Playground
-- Master Encryption Key used in seed: 'rea-super-secret-development-key-2026'
-- ============================================================================

DO $$
DECLARE
    enc_key TEXT := 'rea-super-secret-development-key-2026';
    stripe_id UUID;
    hubspot_id UUID;
    internal_id UUID;
BEGIN
    -- 1. Insert Stripe Provider
    stripe_id := register_api_provider(
        'Stripe Billing API',
        'stripe',
        'Stripe payment processing, recurring subscriptions, and customer invoicing',
        'https://api.stripe.com',
        'bearer',
        'Authorization',
        'Bearer ',
        'sk_test_51MockStripeKeyForPlaygroundEnvironmentSecurelyStoredInPostgres',
        enc_key
    );

    -- 2. Insert HubSpot Provider
    hubspot_id := register_api_provider(
        'HubSpot CRM',
        'hubspot',
        'HubSpot contacts, company deals, and customer relationship management',
        'https://api.hubapi.com',
        'bearer',
        'Authorization',
        'Bearer ',
        'pat-na1-mock-hubspot-token-secured-by-pgcrypto',
        enc_key
    );

    -- 3. Insert Internal Customer Data Platform
    internal_id := register_api_provider(
        'Internal CDP & Auth',
        'internal-cdp',
        'Internal enterprise user profile service and role management',
        'https://api.internal.company.net',
        'api_key',
        'X-Service-Token',
        '',
        'srv_secret_prod_internal_cdp_token_pgcrypto',
        enc_key
    );

    -- ========================================================================
    -- Endpoint Templates
    -- ========================================================================

    -- Stripe: List Subscriptions
    INSERT INTO endpoint_templates (
        provider_id, name, description, category, http_method, path_template,
        required_params, optional_params, headers_template, sample_queries, risk_level
    ) VALUES (
        stripe_id,
        'List Active Subscriptions',
        'Retrieve current subscriptions filtered by status and customer email or ID',
        'Billing',
        'GET',
        '/v1/subscriptions',
        '[]'::jsonb,
        '[
            {"name": "status", "type": "string", "description": "Subscription status filter (e.g. active, past_due, canceled)", "default": "active", "location": "query"},
            {"name": "limit", "type": "number", "description": "Max number of items to return", "default": 10, "location": "query"},
            {"name": "customer", "type": "string", "description": "Filter by Stripe Customer ID (cus_...)", "location": "query"}
        ]'::jsonb,
        '{"Accept": "application/json"}'::jsonb,
        ARRAY[
            'Show all active subscriptions',
            'List subscriptions that are past due',
            'Get subscriptions for customer cus_9921',
            'Fetch latest 5 subscriptions'
        ],
        'read_only'
    );

    -- Stripe: Get Customer By Email
    INSERT INTO endpoint_templates (
        provider_id, name, description, category, http_method, path_template,
        required_params, optional_params, headers_template, sample_queries, risk_level
    ) VALUES (
        stripe_id,
        'Find Customer by Email',
        'Lookup customer profile, payment methods, and account balance in Stripe by email address',
        'Billing',
        'GET',
        '/v1/customers/search',
        '[
            {"name": "query", "type": "string", "description": "Search query formatted as email:''example@domain.com''", "location": "query"}
        ]'::jsonb,
        '[]'::jsonb,
        '{"Accept": "application/json"}'::jsonb,
        ARRAY[
            'Find customer by email alice@acme.corp',
            'Lookup customer account for bob@gmail.com',
            'Search customer profile test@example.com'
        ],
        'read_only'
    );

    -- Stripe: Fetch Invoices
    INSERT INTO endpoint_templates (
        provider_id, name, description, category, http_method, path_template,
        required_params, optional_params, headers_template, sample_queries, risk_level
    ) VALUES (
        stripe_id,
        'Fetch Invoices for Customer',
        'List billing invoices for a specific customer with payment and PDF download links',
        'Billing',
        'GET',
        '/v1/invoices',
        '[]'::jsonb,
        '[
            {"name": "customer", "type": "string", "description": "Customer ID (cus_...)", "location": "query"},
            {"name": "status", "type": "string", "description": "Invoice status (paid, open, void, uncollectible)", "default": "paid", "location": "query"},
            {"name": "limit", "type": "number", "description": "Number of invoices", "default": 5, "location": "query"}
        ]'::jsonb,
        '{"Accept": "application/json"}'::jsonb,
        ARRAY[
            'Get all paid invoices for cus_123',
            'List recent open invoices',
            'Fetch latest invoices for customer cus_stripe_88'
        ],
        'read_only'
    );

    -- HubSpot: Get Contact Details
    INSERT INTO endpoint_templates (
        provider_id, name, description, category, http_method, path_template,
        required_params, optional_params, headers_template, sample_queries, risk_level
    ) VALUES (
        hubspot_id,
        'Get CRM Contact Details',
        'Fetch HubSpot CRM contact properties, lifecycle stage, owner, and company association',
        'CRM',
        'GET',
        '/crm/v3/objects/contacts/:contactId',
        '[
            {"name": "contactId", "type": "string", "description": "HubSpot contact ID or email address", "location": "path"}
        ]'::jsonb,
        '[
            {"name": "properties", "type": "string", "description": "Comma separated fields to return", "default": "firstname,lastname,email,lifecycle_stage,company", "location": "query"}
        ]'::jsonb,
        '{"Accept": "application/json"}'::jsonb,
        ARRAY[
            'Get contact info for 50192',
            'Fetch HubSpot details for contact_8819',
            'Inspect CRM properties for contact 10923'
        ],
        'read_only'
    );

    -- HubSpot: List High-Value Deals
    INSERT INTO endpoint_templates (
        provider_id, name, description, category, http_method, path_template,
        required_params, optional_params, headers_template, sample_queries, risk_level
    ) VALUES (
        hubspot_id,
        'List Enterprise Deals',
        'Search open sales deals in HubSpot CRM filtered by stage or minimum dollar amount',
        'CRM',
        'GET',
        '/crm/v3/objects/deals',
        '[]'::jsonb,
        '[
            {"name": "limit", "type": "number", "description": "Number of deals to retrieve", "default": 10, "location": "query"},
            {"name": "dealstage", "type": "string", "description": "Stage name (e.g., contractsent, closedwon)", "location": "query"}
        ]'::jsonb,
        '{"Accept": "application/json"}'::jsonb,
        ARRAY[
            'List all deals in contractsent stage',
            'Show top enterprise deals',
            'Fetch latest closed-won deals from CRM'
        ],
        'read_only'
    );

    -- Internal CDP: Get User Profile by ID
    INSERT INTO endpoint_templates (
        provider_id, name, description, category, http_method, path_template,
        required_params, optional_params, headers_template, sample_queries, risk_level
    ) VALUES (
        internal_id,
        'Fetch User Profile by User ID',
        'Query internal microservice for user account status, permissions, email, and organization ID',
        'Internal CDP',
        'GET',
        '/api/v2/users/:userId',
        '[
            {"name": "userId", "type": "string", "description": "Unique system user identifier (usr_...)", "location": "path"}
        ]'::jsonb,
        '[]'::jsonb,
        '{"Accept": "application/json"}'::jsonb,
        ARRAY[
            'Find user profile for usr_884920',
            'Get account info for user usr_alice_99',
            'Inspect permissions for user usr_4021'
        ],
        'read_only'
    );

    -- Internal CDP: Revoke User Sessions (Idempotent write)
    INSERT INTO endpoint_templates (
        provider_id, name, description, category, http_method, path_template,
        required_params, optional_params, headers_template, default_body_template, sample_queries, risk_level
    ) VALUES (
        internal_id,
        'Revoke Active User Sessions',
        'Invalidates all active JWT refresh tokens and active browser sessions for a compromised user',
        'Internal CDP',
        'POST',
        '/api/v2/users/:userId/revoke-sessions',
        '[
            {"name": "userId", "type": "string", "description": "Target user ID whose sessions should be terminated", "location": "path"}
        ]'::jsonb,
        '[]'::jsonb,
        '{"Content-Type": "application/json"}'::jsonb,
        '{"reason": "Security reset triggered via API playground"}'::jsonb,
        ARRAY[
            'Revoke all sessions for user usr_884920',
            'Force logout user usr_compromised_12',
            'Invalidate tokens for user usr_3391'
        ],
        'idempotent_write'
    );

END $$;
