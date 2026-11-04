-- Applied transactionally by scripts/database/migrate.mjs. Credentials are provisioned separately.
CREATE SCHEMA IF NOT EXISTS accordly;
CREATE SCHEMA IF NOT EXISTS accordly_private;
REVOKE ALL ON SCHEMA accordly, accordly_private FROM PUBLIC;
DO $$ BEGIN
 IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='accordly_runtime') THEN CREATE ROLE accordly_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
 IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='accordly_app') THEN CREATE ROLE accordly_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
 IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='accordly_maintenance') THEN CREATE ROLE accordly_maintenance LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
END $$;
GRANT accordly_runtime TO accordly_app;
GRANT USAGE ON SCHEMA accordly, accordly_private TO accordly_runtime;
CREATE FUNCTION accordly_private.org_id() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('accordly.org_id',true),'') $$;
CREATE FUNCTION accordly_private.user_id() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('accordly.user_id',true),'') $$;
CREATE FUNCTION accordly_private.can_edit() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('accordly.role',true) IN ('admin','editor'),false) $$;
CREATE FUNCTION accordly_private.is_admin() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('accordly.role',true)='admin',false) $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA accordly_private FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accordly_private.org_id(),accordly_private.user_id(),accordly_private.can_edit(),accordly_private.is_admin() TO accordly_runtime;
CREATE TABLE accordly.organizations (
 id text PRIMARY KEY CHECK(id LIKE 'org_%'), name text NOT NULL, plan text NOT NULL DEFAULT 'free',
 retention_days integer NOT NULL DEFAULT 180 CHECK(retention_days BETWEEN 1 AND 395), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE accordly.memberships (
 organization_id text NOT NULL REFERENCES accordly.organizations ON DELETE CASCADE,
 user_id text NOT NULL, role text NOT NULL CHECK(role IN ('admin','editor','viewer')), verified_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(organization_id,user_id)
);
CREATE TABLE accordly.projects (
 id text PRIMARY KEY, organization_id text NOT NULL REFERENCES accordly.organizations ON DELETE CASCADE,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 80), domain text NOT NULL, draft jsonb NOT NULL,
 active_release text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,id)
);
CREATE TABLE accordly.releases (
 id text PRIMARY KEY, organization_id text NOT NULL, project_id text NOT NULL,
 config jsonb NOT NULL, banner jsonb NOT NULL, config_hash text NOT NULL CHECK(config_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,project_id,id),
 FOREIGN KEY(organization_id,project_id) REFERENCES accordly.projects(organization_id,id) ON DELETE CASCADE
);
ALTER TABLE accordly.projects ADD CONSTRAINT active_release_same_project FOREIGN KEY(organization_id,id,active_release) REFERENCES accordly.releases(organization_id,project_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX release_hash_lookup ON accordly.releases(project_id,config_hash);
CREATE TABLE accordly.events (
 organization_id text NOT NULL, project_id text NOT NULL, event_id uuid NOT NULL,
 release_id text NOT NULL, kind text NOT NULL CHECK(kind IN ('v1','legacy')), payload jsonb NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(project_id,event_id),
 FOREIGN KEY(organization_id,project_id,release_id) REFERENCES accordly.releases(organization_id,project_id,id) ON DELETE CASCADE
);
CREATE INDEX events_tenant_time ON accordly.events(organization_id,received_at DESC);
CREATE TABLE accordly.audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id text NOT NULL REFERENCES accordly.organizations ON DELETE CASCADE,
 actor_id text NOT NULL DEFAULT accordly_private.user_id(), action text NOT NULL, project_id text,
 created_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(organization_id,project_id) REFERENCES accordly.projects(organization_id,id) ON DELETE CASCADE
);
CREATE TABLE accordly.deletion_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id text NOT NULL REFERENCES accordly.organizations ON DELETE CASCADE,
 project_id text NOT NULL, requested_by text NOT NULL DEFAULT accordly_private.user_id(),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed')), created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
-- Neither Supabase anon/authenticated roles nor PUBLIC receive application table privileges.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['memberships','projects','releases','events','audit_events','deletion_jobs'] LOOP
 EXECUTE format('ALTER TABLE accordly.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE accordly.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY tenant_read ON accordly.%I FOR SELECT TO accordly_runtime USING (organization_id = accordly_private.org_id() AND accordly_private.user_id() IS NOT NULL)',t);
 END LOOP;
END $$;

ALTER TABLE accordly.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accordly.organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_read ON accordly.organizations FOR SELECT TO accordly_runtime USING(id=accordly_private.org_id() AND accordly_private.user_id() IS NOT NULL);
CREATE POLICY org_bootstrap ON accordly.organizations FOR INSERT TO accordly_runtime WITH CHECK(id=accordly_private.org_id() AND accordly_private.user_id() IS NOT NULL);
CREATE POLICY org_admin ON accordly.organizations FOR UPDATE TO accordly_runtime USING(id=accordly_private.org_id() AND accordly_private.is_admin()) WITH CHECK(id=accordly_private.org_id());
CREATE POLICY membership_sync_insert ON accordly.memberships FOR INSERT TO accordly_runtime WITH CHECK(organization_id=accordly_private.org_id() AND user_id=accordly_private.user_id() AND role=current_setting('accordly.role',true));
CREATE POLICY membership_sync_update ON accordly.memberships FOR UPDATE TO accordly_runtime USING(organization_id=accordly_private.org_id() AND user_id=accordly_private.user_id()) WITH CHECK(organization_id=accordly_private.org_id() AND user_id=accordly_private.user_id() AND role=current_setting('accordly.role',true));
CREATE POLICY project_create ON accordly.projects FOR INSERT TO accordly_runtime WITH CHECK(organization_id=accordly_private.org_id() AND accordly_private.can_edit());
CREATE POLICY project_update ON accordly.projects FOR UPDATE TO accordly_runtime USING(organization_id=accordly_private.org_id() AND accordly_private.can_edit()) WITH CHECK(organization_id=accordly_private.org_id() AND accordly_private.can_edit());
CREATE POLICY release_publish ON accordly.releases FOR INSERT TO accordly_runtime WITH CHECK(organization_id=accordly_private.org_id() AND accordly_private.is_admin());
CREATE POLICY audit_append ON accordly.audit_events FOR INSERT TO accordly_runtime WITH CHECK(organization_id=accordly_private.org_id() AND actor_id=accordly_private.user_id());
CREATE POLICY deletion_request ON accordly.deletion_jobs FOR INSERT TO accordly_runtime WITH CHECK(organization_id=accordly_private.org_id() AND requested_by=accordly_private.user_id() AND accordly_private.is_admin() AND EXISTS(SELECT 1 FROM accordly.projects WHERE id=project_id AND organization_id=accordly_private.org_id()));
GRANT SELECT ON ALL TABLES IN SCHEMA accordly TO accordly_runtime;
GRANT INSERT ON accordly.organizations TO accordly_runtime;
GRANT INSERT,UPDATE ON accordly.memberships TO accordly_runtime;
GRANT INSERT ON accordly.projects,accordly.releases,accordly.audit_events,accordly.deletion_jobs TO accordly_runtime;
GRANT UPDATE(name,domain,draft) ON accordly.projects TO accordly_runtime;
GRANT UPDATE(retention_days) ON accordly.organizations TO accordly_runtime;
-- Publishing is an admin-only function: editors cannot set an active pointer directly.
CREATE FUNCTION accordly.activate_release(p_project text,p_release text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN
 IF NOT accordly_private.is_admin() OR accordly_private.org_id() IS NULL THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 UPDATE accordly.projects SET active_release=p_release WHERE id=p_project AND organization_id=accordly_private.org_id();
 IF NOT FOUND THEN RAISE EXCEPTION 'Project not found' USING ERRCODE='P0002'; END IF;
END $$;
-- Narrow public delivery capability; no drafts, memberships, or organization data are returned.
CREATE FUNCTION accordly.public_release(p_project text,p_version text DEFAULT NULL,p_hash text DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',r.id,'projectId',p.id,'domain',p.domain,'config',r.config,'banner',r.banner)
 FROM accordly.projects p JOIN accordly.releases r ON r.project_id=p.id AND r.organization_id=p.organization_id
 WHERE p.id=p_project AND CASE WHEN p_hash IS NOT NULL THEN r.config_hash=p_hash WHEN p_version IS NOT NULL AND p_version<>'current' THEN r.id=p_version ELSE r.id=p.active_release END
 ORDER BY r.created_at DESC LIMIT 1
$$;
CREATE FUNCTION accordly.ingest_event(p_project text,p_release text,p_kind text,p_payload jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE org text; eid uuid; previous jsonb; BEGIN
 SELECT organization_id INTO org FROM accordly.releases WHERE project_id=p_project AND id=p_release;
 IF org IS NULL OR p_payload->>'projectId' IS DISTINCT FROM p_project THEN RAISE EXCEPTION 'Unknown release'; END IF;
 IF p_kind='v1' THEN
  IF p_payload->>'schemaVersion'<>'1' OR p_payload->>'configHash' IS DISTINCT FROM (SELECT config_hash FROM accordly.releases WHERE id=p_release) THEN RAISE EXCEPTION 'Invalid version or hash'; END IF;
  IF EXISTS(SELECT FROM jsonb_object_keys(p_payload) k WHERE k NOT IN ('schemaVersion','eventId','projectId','subjectId','configHash','action','choices','country','language','gpcDetected','clientTime')) THEN RAISE EXCEPTION 'Unknown event field'; END IF;
  eid:=(p_payload->>'eventId')::uuid;
 ELSIF p_kind='legacy' THEN
  IF p_payload->>'configurationVersion' IS DISTINCT FROM p_release THEN RAISE EXCEPTION 'Invalid version'; END IF;
  IF EXISTS(SELECT FROM jsonb_object_keys(p_payload) k WHERE k NOT IN ('receiptId','projectId','configurationVersion','choices','action','clientTimestamp','sdkVersion','source')) THEN RAISE EXCEPTION 'Unknown receipt field'; END IF;
  eid:=(p_payload->>'receiptId')::uuid;
 ELSE RAISE EXCEPTION 'Unknown event kind'; END IF;
 INSERT INTO accordly.events(organization_id,project_id,event_id,release_id,kind,payload) VALUES(org,p_project,eid,p_release,p_kind,p_payload) ON CONFLICT DO NOTHING;
 IF FOUND THEN RETURN false; END IF;
 SELECT payload INTO previous FROM accordly.events WHERE project_id=p_project AND event_id=eid;
 IF previous IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'Event ID conflict' USING ERRCODE='23505'; END IF;
 RETURN true;
END $$;
CREATE FUNCTION accordly.process_retention(p_batch integer DEFAULT 1000) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE removed integer; projects_removed integer:=0; job record; BEGIN
 IF p_batch<1 OR p_batch>10000 THEN RAISE EXCEPTION 'Invalid batch'; END IF;
 WITH expired AS (SELECT e.ctid FROM accordly.events e JOIN accordly.organizations o ON o.id=e.organization_id WHERE e.received_at<now()-make_interval(days=>o.retention_days) ORDER BY e.received_at LIMIT p_batch FOR UPDATE OF e SKIP LOCKED)
 DELETE FROM accordly.events WHERE ctid IN(SELECT ctid FROM expired);
 GET DIAGNOSTICS removed=ROW_COUNT;
 FOR job IN SELECT * FROM accordly.deletion_jobs WHERE status='pending' ORDER BY created_at LIMIT 20 FOR UPDATE SKIP LOCKED LOOP
  DELETE FROM accordly.projects WHERE id=job.project_id AND organization_id=job.organization_id;
  UPDATE accordly.deletion_jobs SET status='completed',completed_at=now() WHERE id=job.id;
  projects_removed:=projects_removed+1;
 END LOOP;
 RETURN jsonb_build_object('eventsDeleted',removed,'deletionJobsCompleted',projects_removed);
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA accordly FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accordly.activate_release(text,text),accordly.public_release(text,text,text),accordly.ingest_event(text,text,text,jsonb) TO accordly_runtime;
GRANT USAGE ON SCHEMA accordly TO accordly_maintenance;
GRANT EXECUTE ON FUNCTION accordly.process_retention(integer) TO accordly_maintenance;
ALTER DEFAULT PRIVILEGES IN SCHEMA accordly REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
