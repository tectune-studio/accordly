CREATE TABLE accordly.domain_challenges (
 id uuid PRIMARY KEY,organization_id text NOT NULL,project_id text NOT NULL,domain text NOT NULL,
 method text NOT NULL CHECK(method IN('dns','http')),token_hash text NOT NULL CHECK(token_hash ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz NOT NULL,verified_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),last_attempt_at timestamptz,
 FOREIGN KEY(organization_id,project_id) REFERENCES accordly.projects(organization_id,id) ON DELETE CASCADE,
 UNIQUE(project_id)
);
ALTER TABLE accordly.domain_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE accordly.domain_challenges FORCE ROW LEVEL SECURITY;
CREATE POLICY challenge_read ON accordly.domain_challenges FOR SELECT TO accordly_runtime USING(organization_id=accordly_private.org_id() AND accordly_private.user_id() IS NOT NULL);
CREATE POLICY challenge_insert ON accordly.domain_challenges FOR INSERT TO accordly_runtime WITH CHECK(organization_id=accordly_private.org_id() AND accordly_private.is_admin() AND EXISTS(SELECT FROM accordly.projects p WHERE p.id=project_id AND p.domain=domain_challenges.domain));
CREATE POLICY challenge_update ON accordly.domain_challenges FOR UPDATE TO accordly_runtime USING(organization_id=accordly_private.org_id() AND accordly_private.is_admin()) WITH CHECK(organization_id=accordly_private.org_id() AND accordly_private.is_admin());
GRANT SELECT,INSERT,UPDATE ON accordly.domain_challenges TO accordly_runtime;
-- Verification is exact-hostname/project bound, valid for 30 days. Rotation clears proof.
CREATE FUNCTION accordly.domain_is_verified(p_project text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT FROM accordly.domain_challenges c JOIN accordly.projects p ON p.id=c.project_id AND p.organization_id=c.organization_id WHERE p.id=p_project AND c.domain=p.domain AND c.verified_at>now()-interval '30 days')
$$;
REVOKE ALL ON FUNCTION accordly.domain_is_verified(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accordly.domain_is_verified(text) TO accordly_runtime;
CREATE OR REPLACE FUNCTION accordly.activate_release(p_project text,p_release text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN
 IF NOT accordly_private.is_admin() OR accordly_private.org_id() IS NULL THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF NOT accordly.domain_is_verified(p_project) THEN RAISE EXCEPTION 'Verify domain ownership before publishing' USING ERRCODE='42501'; END IF;
 UPDATE accordly.projects SET active_release=p_release WHERE id=p_project AND organization_id=accordly_private.org_id();
 IF NOT FOUND THEN RAISE EXCEPTION 'Project not found' USING ERRCODE='P0002'; END IF;
END $$;
CREATE OR REPLACE FUNCTION accordly.public_release(p_project text,p_version text DEFAULT NULL,p_hash text DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',r.id,'projectId',p.id,'domain',p.domain,'domainVerified',true,'config',r.config,'banner',r.banner)
 FROM accordly.projects p JOIN accordly.releases r ON r.project_id=p.id AND r.organization_id=p.organization_id
 WHERE p.id=p_project AND accordly.domain_is_verified(p.id) AND CASE WHEN p_hash IS NOT NULL THEN r.config_hash=p_hash WHEN p_version IS NOT NULL AND p_version<>'current' THEN r.id=p_version ELSE r.id=p.active_release END
 ORDER BY r.created_at DESC LIMIT 1
$$;
