-- Provision this login's password separately; never commit it.
DO $$ BEGIN
 IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='accordly_ingest') THEN
 CREATE ROLE accordly_ingest LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
 END IF;
END $$;
GRANT USAGE ON SCHEMA accordly TO accordly_ingest;
CREATE FUNCTION accordly.ingest_worker_event(p_origin text,p_event jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE release text; BEGIN
 SELECT r.id INTO release FROM accordly.releases r
 JOIN accordly.projects p ON p.id=r.project_id AND p.organization_id=r.organization_id
 WHERE r.project_id=p_event->>'projectId' AND r.config_hash=p_event->>'configHash'
 AND p_origin='https://'||p.domain
 AND EXISTS (SELECT 1 FROM accordly.domain_challenges d WHERE d.project_id=p.id AND d.domain=p.domain AND d.verified_at>now()-interval '30 days')
 ORDER BY r.created_at DESC LIMIT 1;
 IF release IS NULL THEN RAISE EXCEPTION 'Unknown release or unverified origin'; END IF;
 RETURN accordly.ingest_event(p_event->>'projectId',release,'v1',p_event);
END $$;
REVOKE ALL ON FUNCTION accordly.ingest_worker_event(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accordly.ingest_worker_event(text,jsonb) TO accordly_ingest;
