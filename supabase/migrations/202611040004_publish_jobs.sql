-- A durable journal; unfinished jobs are resumed before a newer publish can start.
CREATE TABLE accordly.publish_jobs (
 id uuid PRIMARY KEY,
 generation bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 organization_id text NOT NULL,
 project_id text NOT NULL,
 release_id text NOT NULL,
 domain text NOT NULL,
 verified_until timestamptz NOT NULL,
 phase text NOT NULL DEFAULT 'validated' CHECK(phase IN ('validated','stored','pointed','invalidated','completed')),
 attempts integer NOT NULL DEFAULT 0,
 last_error text,
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 FOREIGN KEY(organization_id,project_id,release_id) REFERENCES accordly.releases(organization_id,project_id,id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX one_pending_publish ON accordly.publish_jobs(project_id) WHERE phase <> 'completed';
ALTER TABLE accordly.publish_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE accordly.publish_jobs FORCE ROW LEVEL SECURITY;
CREATE POLICY publish_read ON accordly.publish_jobs FOR SELECT TO accordly_runtime USING(organization_id=accordly_private.org_id() AND accordly_private.user_id() IS NOT NULL);
CREATE POLICY publish_insert ON accordly.publish_jobs FOR INSERT TO accordly_runtime WITH CHECK(organization_id=accordly_private.org_id() AND accordly_private.is_admin());
CREATE POLICY publish_update ON accordly.publish_jobs FOR UPDATE TO accordly_runtime USING(organization_id=accordly_private.org_id() AND accordly_private.is_admin()) WITH CHECK(organization_id=accordly_private.org_id() AND accordly_private.is_admin());
GRANT SELECT,INSERT,UPDATE ON accordly.publish_jobs TO accordly_runtime;
GRANT USAGE ON SEQUENCE accordly.publish_jobs_generation_seq TO accordly_runtime;
-- Staged releases are private until the entire publish workflow completes.
CREATE OR REPLACE FUNCTION accordly.public_release(p_project text,p_version text DEFAULT NULL,p_hash text DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',r.id,'projectId',p.id,'domain',p.domain,'domainVerified',true,'config',r.config,'banner',r.banner)
 FROM accordly.projects p JOIN accordly.releases r ON r.project_id=p.id AND r.organization_id=p.organization_id
 WHERE p.id=p_project AND accordly.domain_is_verified(p.id)
 AND EXISTS(SELECT FROM accordly.publish_jobs j WHERE j.project_id=p.id AND j.release_id=r.id AND j.phase='completed')
 AND CASE WHEN p_hash IS NOT NULL THEN r.config_hash=p_hash WHEN p_version IS NOT NULL AND p_version<>'current' THEN r.id=p_version ELSE r.id=p.active_release END
 ORDER BY r.created_at DESC LIMIT 1
$$;
