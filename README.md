# REA Postman: Secure Natural Language API Playground

> **An API Playground for Non-Technical Teams (Product Managers, Operations, Customer Success)** that translates natural language prompts into live, secure API requests **without ever exposing upstream API keys or tokens to the browser**.

---

## 1. Executive Summary & Security Model

In most organizations, product managers and operations staff frequently need to inspect live customer records, check subscription statuses, or troubleshoot issues across various services (e.g., Stripe, HubSpot, internal microservices). However:
1. **Traditional tools (Postman, Insomnia)** require raw API keys, bearer tokens, and complex header configurations. Giving non-technical staff direct access to production secrets introduces severe data leak and credential compromise risks.
2. **Client-side LLM wrappers** that make external API calls directly from the browser risk exposing authorization headers in network inspection tabs or leaking secrets through DOM manipulation.

### The Zero-Frontend-Secrets Solution
```
┌────────────────────────────────────────────────────────┐
│               Frontend: Next.js (App Router)           │
│  - Natural Language Input ("Find customer by email")   │
│  - Pre-approved Endpoints Sidebar                      │
│  - Monaco Editor JSON Viewer                           │
│  - NO SECRETS, NO TOKENS, NO CREDENTIALS              │
└───────────────────────────┬────────────────────────────┘
                            │ POST /api/execute-nl
                            ▼
┌────────────────────────────────────────────────────────┐
│            Backend: Node.js Express Gateway            │
│                                                        │
│  1. matchIntentToEndpoint(nlQuery, endpoints)          │
│     - Intent classifier & parameter extractor          │
│     - Strict whitelist verification                    │
│                                                        │
│  2. injectAuthAndExecute(endpoint, params)             │
│     - Pulls encrypted secret from Supabase (pgcrypto)  │
│     - Decrypts in server memory only                   │
│     - Injects Auth header on the fly                   │
│     - Executes Axios/Fetch call                        │
│                                                        │
│  3. logExecutionAudit(...)                             │
│     - Writes query, user, timestamp, latency to DB     │
│                                                        │
│  4. Returns sanitized response to frontend             │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│      Supabase Postgres    │ │    Upstream Services     │
│  - pgcrypto extension     │ │  - Stripe                │
│  - api_providers          │ │  - HubSpot               │
│  - endpoint_templates     │ │  - Internal Microservices│
│  - audit_logs (RLS)       │ └──────────────────────────┘
└───────────────────────────┘
```

---

## 2. How LLM Intent Routing Works

The backend service (`apps/api`) implements a controlled, two-stage intent translation pipeline:

### Step 1: Whitelist-Constrained Template Matching
Rather than granting an LLM arbitrary internet access (which invites **Server-Side Request Forgery (SSRF)** and **Prompt Injection**), all permissible operations are registered in Supabase as `endpoint_templates`.
- Each template defines the HTTP method (`GET`, `POST`, etc.), path template (`/v1/customers/search`), required/optional parameters, headers, and risk level (`read_only`, `idempotent_write`, `destructive`).
- The `matchIntentToEndpoint(nlQuery, availableEndpoints)` function computes a multi-factor score:
  - Exact or partial match with pre-defined `sample_queries`
  - Domain concept matches (e.g. "subscription", "customer", "invoice", "deal", "profile")
  - Tokenized schema overlap against endpoint descriptions and path segments
- **Threshold Enforcement**: If the top score falls below the confidence cutoff, execution is halted, and safe suggestions are returned.

### Step 2: Parameter Extraction & Schema Validation
The classifier parses out dynamic parameters from the query string:
- **Email addresses**: `alice@acme.corp` $\rightarrow$ `{ query: "email:'alice@acme.corp'" }`
- **Customer IDs**: `cus_9921_alpha` $\rightarrow$ `{ customer: "cus_9921_alpha" }`
- **User IDs**: `usr_884920` $\rightarrow$ `{ userId: "usr_884920" }`
- **Filters & Statuses**: "past due", "active", "paid", "contractsent" $\rightarrow$ `{ status: "past_due" }`
- **Limits**: "latest 5", "top 10" $\rightarrow$ `{ limit: 5 }`

### Step 3: Server-Side In-Memory Token Decryption
- The backend queries Supabase using the database function `get_decrypted_provider_token(provider_id, encryption_key)` powered by `pgcrypto` (`pgp_sym_decrypt`).
- The decrypted API key is stored exclusively in ephemeral server memory during the request cycle.
- The `Authorization` header is attached directly to the upstream Axios call.
- The response returned to the frontend replaces all authorization headers with `••••••••[PROTECTED_BY_SERVER]`.

### Step 4: Full Audit Trail
Every query executed by any PM or operations agent is saved to the `audit_logs` table with:
- Exact natural language query
- Resolved endpoint template ID & URL
- Injected parameters
- Latency (ms) and HTTP status code
- User identifier

---

## 3. Monorepo Structure

```
rea-postman/
├── package.json              # Monorepo workspaces definition
├── tsconfig.base.json        # Shared TypeScript compiler settings
├── railway.toml              # Railway deployment specification
├── README.md                 # Architecture and usage documentation
│
├── apps/
│   ├── web/                  # Next.js Frontend (App Router, Tailwind, Zustand, Monaco)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── Header.tsx           # System status & navigation
│   │   │   │   ├── Sidebar.tsx          # Pre-configured endpoint explorer
│   │   │   │   ├── QueryInput.tsx       # Chat-like NL input with prompt chips
│   │   │   │   ├── MonacoViewer.tsx     # Monaco Editor JSON viewer
│   │   │   │   ├── ExecutionDetails.tsx # Telemetry, URL, sanitized headers
│   │   │   │   └── AuditHistoryModal.tsx# Chronological compliance ledger
│   │   │   ├── store/
│   │   │   │   └── usePlaygroundStore.ts# Full Zustand state management
│   │   │   └── types/index.ts
│   │
│   └── api/                  # Node.js Express Gateway
│       ├── package.json
│       ├── Dockerfile        # Container image for Railway / Cloud
│       └── src/
│           ├── index.ts      # Server entry point
│           ├── server.ts     # Express configuration & CORS
│           ├── config.ts     # Environment loader
│           ├── routes/
│           │   ├── execute.ts    # POST /api/execute-nl
│           │   └── endpoints.ts  # GET /api/endpoints & audit logs
│           ├── services/
│           │   ├── llmRouter.ts  # matchIntentToEndpoint() logic
│           │   ├── executor.ts   # injectAuthAndExecute() with pgcrypto
│           │   └── auditLogger.ts# Audit trail writer
│           └── utils/
│               └── mockResponses.ts # Realistic fallback payloads for demo
│
└── packages/
    └── db/                   # Supabase Database Package
        ├── package.json
        ├── schema.sql        # Supabase migration (pgcrypto, RLS, tables, functions)
        ├── seed.sql          # Seed data with encrypted sample tokens
        └── src/
            ├── client.ts     # Typed Supabase client with offline resilience
            ├── queries.ts    # Data access functions
            ├── types.ts      # Shared domain interfaces
            └── index.ts
```

---

## 4. Database Setup & Supabase Migrations

The database leverages PostgreSQL `pgcrypto` to encrypt sensitive third-party tokens at rest.

### Step 1: Run `schema.sql` in Supabase
In your Supabase SQL Editor, run `packages/db/schema.sql`. This:
- Enables the `pgcrypto` extension: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- Creates `api_providers`, `endpoint_templates`, and `audit_logs` tables.
- Creates the stored procedure `register_api_provider(...)` which calls `pgp_sym_encrypt`.
- Creates the stored procedure `get_decrypted_provider_token(...)` which calls `pgp_sym_decrypt`.
- Enables Row Level Security (RLS) so provider secrets are never readable by anon or public roles.

### Step 2: Run `seed.sql`
Run `packages/db/seed.sql` to populate:
- Providers: Stripe, HubSpot, and Internal CDP.
- Realistic templates for:
  - *List Active Subscriptions*
  - *Find Customer by Email*
  - *Fetch Invoices for Customer*
  - *Get CRM Contact Details*
  - *List Enterprise Deals*
  - *Fetch User Profile by User ID*
  - *Revoke Active User Sessions*

---

## 5. Local Development Quickstart

### Prerequisites
- Node.js >= 20
- npm >= 10

### 1. Install all dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in the root:
```bash
cp .env.example .env
```
Provide your Supabase URL and keys (or leave defaults for offline mock mode):
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
SUPABASE_ANON_KEY=eyJh...
SUPABASE_DB_ENCRYPTION_KEY=rea-super-secret-development-key-2026
```

### 3. Build DB Package
```bash
npm run build:db
```

### 4. Run Both API and Frontend in Dev Mode
```bash
# Terminal 1: Run Express API Server (Port 4000)
npm run dev:api

# Terminal 2: Run Next.js Frontend (Port 3000)
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Railway Deployment Guide

The Node.js API server is pre-configured for one-click deployment on Railway using `railway.toml`:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build:db && npm run build:api"

[deploy]
startCommand = "npm run start:api"
healthcheckPath = "/api/health"
healthcheckTimeout = 120
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

### Deploying to Railway:
1. Connect your GitHub repository to [Railway.app](https://railway.app).
2. Set the Root Directory to `/` or deploy from root.
3. In the Railway dashboard under **Variables**, set:
   - `PORT`: `4000`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: URL of your deployed Next.js web application (e.g. Vercel)
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key
   - `SUPABASE_DB_ENCRYPTION_KEY`: Master symmetric key matching your `seed.sql`
4. Railway will automatically build `@rea/db` and `@rea/api`, run health checks on `/api/health`, and serve traffic securely.

---

## 7. Sample Queries to Test

Try entering any of the following natural language requests in the UI:
1. `"Find customer by email alice@acme.corp"`
2. `"Show all active subscriptions"`
3. `"Get all paid invoices for cus_123"`
4. `"Get contact info for 50192"`
5. `"List all deals in contractsent stage"`
6. `"Find user profile for usr_884920"`
7. `"Revoke all sessions for user usr_884920"`

Notice how:
- The intent matches to the correct template
- Parameters are extracted and displayed in the telemetry bar
- Secret authorization tokens are injected server-side and redacted from the response
- The full JSON response renders formatted in the Monaco Editor
- The transaction is recorded in the System Audit Trail
