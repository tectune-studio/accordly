-- Production schema scaffold. Local demo uses a JSON repository instead.
CREATE TABLE organizations (id uuid PRIMARY KEY, clerk_org_id text NOT NULL UNIQUE, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE memberships (organization_id uuid NOT NULL REFERENCES organizations, clerk_user_id text NOT NULL, role text NOT NULL CHECK(role IN ('owner','admin','editor','viewer')), PRIMARY KEY(organization_id,clerk_user_id));
CREATE TABLE projects (id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,id));
CREATE TABLE verified_domains (id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES projects, hostname text NOT NULL UNIQUE, verification_digest text NOT NULL, verified_at timestamptz);
CREATE TABLE configuration_drafts (project_id uuid PRIMARY KEY REFERENCES projects, config jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE configuration_versions (id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES projects, config jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id,id));
CREATE TABLE published_releases (project_id uuid PRIMARY KEY REFERENCES projects, configuration_id uuid NOT NULL, published_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(project_id,configuration_id) REFERENCES configuration_versions(project_id,id));
CREATE TABLE consent_receipts (project_id uuid NOT NULL REFERENCES projects, receipt_id uuid NOT NULL, configuration_id uuid NOT NULL, action text NOT NULL CHECK(action IN ('accept','reject','customize','withdraw')), choices jsonb NOT NULL, client_timestamp timestamptz NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), sdk_version text NOT NULL, PRIMARY KEY(project_id,receipt_id), FOREIGN KEY(project_id,configuration_id) REFERENCES configuration_versions(project_id,id));
CREATE INDEX receipts_project_received ON consent_receipts(project_id,received_at DESC);
CREATE TABLE subscriptions (organization_id uuid PRIMARY KEY REFERENCES organizations, stripe_customer_id text UNIQUE, stripe_subscription_id text UNIQUE, plan text NOT NULL, status text NOT NULL);
CREATE TABLE processed_webhooks (event_id text PRIMARY KEY, processed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE usage_daily (project_id uuid NOT NULL REFERENCES projects, day date NOT NULL, managed_loads bigint NOT NULL DEFAULT 0 CHECK(managed_loads>=0), PRIMARY KEY(project_id,day));
CREATE TABLE audit_events (id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations, project_id uuid, actor_id text NOT NULL, action text NOT NULL, at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(organization_id,project_id) REFERENCES projects(organization_id,id));
-- Apply RLS policies and a non-owner runtime role when implementing authenticated storage.
-- Do not expose this database or schema as a tenant-safe API without those controls.
