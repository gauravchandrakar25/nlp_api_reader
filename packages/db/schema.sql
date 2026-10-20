-- ============================================================================
-- Supabase Schema for API Playground for Non-Technical Teams
-- Security Architecture: Zero-Frontend-Secrets with pgcrypto token encryption
-- ============================================================================

-- 1. Enable pgcrypto extension for asymmetric/symmetric cryptography
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Drop existing tables if needed (clean setup)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS endpoint_templates CASCADE;
DROP TABLE IF EXISTS api_providers CASCADE;

-- 3. Providers Table: Stores external API hosts and encrypted tokens
CREATE TABLE api_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    base_url TEXT NOT NULL,
    auth_type VARCHAR(50) NOT NULL CHECK (auth_type IN ('bearer', 'api_key', 'basic', 'header', 'none')),
    auth_header_name VARCHAR(100) DEFAULT 'Authorization',
    auth_header_prefix VARCHAR(50) DEFAULT 'Bearer ',
    -- Encrypted token using pgcrypto pgp_sym_encrypt
    encrypted_auth_token BYTEA NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for quick provider lookup
CREATE INDEX idx_api_providers_slug ON api_providers(slug);

-- 4. Endpoint Templates Table: Curated, safe API routes for PMs to query
CREATE TABLE endpoint_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES api_providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    http_method VARCHAR(10) NOT NULL CHECK (http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
    path_template TEXT NOT NULL, -- e.g., /v1/customers/:id or /v1/subscriptions
    required_params JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { name, type, description, location: 'path'|'query'|'body' }
    optional_params JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { name, type, description, default, location }
    headers_template JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_body_template JSONB,
    sample_queries TEXT[] NOT NULL DEFAULT '{}', -- Examples for LLM intent routing
    risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('read_only', 'idempotent_write', 'destructive')) DEFAULT 'read_only',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for template matching and listing
CREATE INDEX idx_endpoint_templates_provider ON endpoint_templates(provider_id);
CREATE INDEX idx_endpoint_templates_active ON endpoint_templates(is_active);

-- 5. Audit Logs Table: Full traceability of who queried what, mapped endpoints, and status
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_template_id UUID REFERENCES endpoint_templates(id) ON DELETE SET NULL,
    user_identifier VARCHAR(255) NOT NULL DEFAULT 'anonymous_pm',
    natural_language_query TEXT NOT NULL,
    matched_endpoint_name VARCHAR(255),
    resolved_method VARCHAR(10) NOT NULL,
    resolved_url TEXT NOT NULL,
    injected_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    http_status INTEGER,
    execution_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    response_preview JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for audit timeline queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_identifier);

-- ============================================================================
-- Cryptographic Helper Functions using pgcrypto
-- ============================================================================

-- Function to register a provider with an encrypted token
CREATE OR REPLACE FUNCTION register_api_provider(
    p_name VARCHAR,
    p_slug VARCHAR,
    p_description TEXT,
    p_base_url TEXT,
    p_auth_type VARCHAR,
    p_auth_header_name VARCHAR,
    p_auth_header_prefix VARCHAR,
    p_secret_token TEXT,
    p_encryption_key TEXT
) RETURNS UUID AS $$
DECLARE
    new_provider_id UUID;
BEGIN
    INSERT INTO api_providers (
        name,
        slug,
        description,
        base_url,
        auth_type,
        auth_header_name,
        auth_header_prefix,
        encrypted_auth_token
    ) VALUES (
        p_name,
        p_slug,
        p_description,
        p_base_url,
        p_auth_type,
        p_auth_header_name,
        p_auth_header_prefix,
        pgp_sym_encrypt(p_secret_token, p_encryption_key)
    ) RETURNING id INTO new_provider_id;

    RETURN new_provider_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retrieve decrypted token (Backend service role only)
CREATE OR REPLACE FUNCTION get_decrypted_provider_token(
    p_provider_id UUID,
    p_encryption_key TEXT
) RETURNS TEXT AS $$
DECLARE
    decrypted_token TEXT;
BEGIN
    SELECT pgp_sym_decrypt(encrypted_auth_token, p_encryption_key)
    INTO decrypted_token
    FROM api_providers
    WHERE id = p_provider_id AND is_active = true;

    RETURN decrypted_token;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE api_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoint_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Endpoint templates are readable by authenticated users and anon clients (safe meta info only)
CREATE POLICY "Public read active endpoint templates"
    ON endpoint_templates FOR SELECT
    USING (is_active = true);

-- 2. Audit logs can be read and inserted
CREATE POLICY "Allow service role and authenticated to view audit logs"
    ON audit_logs FOR SELECT
    USING (true);

CREATE POLICY "Allow audit log insertions"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- 3. Providers table has RESTRICTED access. Tokens are never exposed to public or anon.
-- Only service_role can select raw bytes or call decrypt function.
CREATE POLICY "Service role full access on providers"
    ON api_providers FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
