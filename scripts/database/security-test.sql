\set ON_ERROR_STOP on
BEGIN;
INSERT INTO accordly.organizations(id,name) VALUES('org_test_a','Tenant A'),('org_test_b','Tenant B');
INSERT INTO accordly.projects(id,organization_id,name,domain,draft) VALUES('test_a','org_test_a','A','a.example','{}'),('test_b','org_test_b','B','b.example','{}');
SET LOCAL ROLE accordly_app;
SELECT set_config('accordly.org_id','org_test_a',true),set_config('accordly.user_id','user_test',true),set_config('accordly.role','viewer',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM accordly.projects)<>1 THEN RAISE EXCEPTION 'Tenant isolation failed'; END IF;
 IF EXISTS(SELECT FROM accordly.projects WHERE id='test_b') THEN RAISE EXCEPTION 'Other tenant visible'; END IF;
 BEGIN INSERT INTO accordly.projects(id,organization_id,name,domain,draft) VALUES('forbidden','org_test_a','X','x.example','{}'); RAISE EXCEPTION 'Viewer write permitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM accordly.activate_release('test_a','fake'); RAISE EXCEPTION 'Viewer publish permitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN DELETE FROM accordly.projects WHERE id='test_a'; RAISE EXCEPTION 'Direct deletion permitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('accordly.role','editor',true);
UPDATE accordly.projects SET name='Edited' WHERE id='test_a';
DO $$ BEGIN
 IF (SELECT name FROM accordly.projects WHERE id='test_a')<>'Edited' THEN RAISE EXCEPTION 'Editor cannot edit'; END IF;
 BEGIN INSERT INTO accordly.projects(id,organization_id,name,domain,draft) VALUES('forbidden','org_test_b','X','x.example','{}'); RAISE EXCEPTION 'Cross-tenant write permitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM accordly.activate_release('test_a','fake'); RAISE EXCEPTION 'Editor publish permitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('accordly.role','admin',true);
INSERT INTO accordly.releases(id,organization_id,project_id,config,banner,config_hash) VALUES('test_release','org_test_a','test_a','{}','{}',repeat('a',64));
DO $$ BEGIN
 BEGIN PERFORM accordly.activate_release('test_a','test_release'); RAISE EXCEPTION 'Unverified publish permitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF accordly.public_release('test_a') IS NOT NULL THEN RAISE EXCEPTION 'Unverified delivery permitted'; END IF;
END $$;
INSERT INTO accordly.domain_challenges(id,organization_id,project_id,domain,method,token_hash,expires_at,verified_at) VALUES(gen_random_uuid(),'org_test_a','test_a','a.example','dns',repeat('b',64),now()+interval '1 day',now());
SELECT accordly.activate_release('test_a','test_release');
INSERT INTO accordly.publish_jobs(id,organization_id,project_id,release_id,domain,verified_until) VALUES('11111111-1111-4111-8111-111111111111','org_test_a','test_a','test_release','a.example',now()+interval '30 days');
DO $$ BEGIN
 IF accordly.public_release('test_a') IS NOT NULL THEN RAISE EXCEPTION 'Staged release is public'; END IF;
 BEGIN INSERT INTO accordly.publish_jobs(id,organization_id,project_id,release_id,domain,verified_until) VALUES(gen_random_uuid(),'org_test_a','test_a','test_release','a.example',now()+interval '30 days'); RAISE EXCEPTION 'Parallel pending publication permitted'; EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN INSERT INTO accordly.publish_jobs(id,organization_id,project_id,release_id,domain,verified_until) VALUES(gen_random_uuid(),'org_test_b','test_a','test_release','a.example',now()+interval '30 days'); RAISE EXCEPTION 'Cross-tenant publication permitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('accordly.role','viewer',true);
UPDATE accordly.publish_jobs SET phase='completed' WHERE project_id='test_a';
DO $$ BEGIN
 IF (SELECT phase FROM accordly.publish_jobs WHERE project_id='test_a')<>'validated' THEN RAISE EXCEPTION 'Viewer changed publish state'; END IF;
END $$;
SELECT set_config('accordly.role','editor',true);
DO $$ BEGIN
 BEGIN INSERT INTO accordly.publish_jobs(id,organization_id,project_id,release_id,domain,verified_until) VALUES(gen_random_uuid(),'org_test_a','test_a','test_release','a.example',now()+interval '30 days'); RAISE EXCEPTION 'Editor published'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('accordly.org_id','org_test_b',true);
DO $$ BEGIN
 IF EXISTS(SELECT FROM accordly.publish_jobs) THEN RAISE EXCEPTION 'Publish jobs leak across tenants'; END IF;
END $$;
SELECT set_config('accordly.org_id','org_test_a',true),set_config('accordly.role','admin',true);
UPDATE accordly.publish_jobs SET generation=DEFAULT,phase='completed',completed_at=now() WHERE project_id='test_a';
DO $$ BEGIN
 IF accordly.public_release('test_a') IS NULL THEN RAISE EXCEPTION 'Completed release unavailable'; END IF;
END $$;
UPDATE accordly.domain_challenges SET verified_at=now()-interval '31 days' WHERE project_id='test_a';
DO $$ BEGIN
 IF accordly.public_release('test_a') IS NOT NULL THEN RAISE EXCEPTION 'Expired proof permits delivery'; END IF;
END $$;
UPDATE accordly.domain_challenges SET verified_at=now() WHERE project_id='test_a';
UPDATE accordly.projects SET domain='changed.example' WHERE id='test_a';
UPDATE accordly.projects SET domain='a.example' WHERE id='test_a';
DO $$ BEGIN
 IF accordly.domain_is_verified('test_a') THEN RAISE EXCEPTION 'Changing a domain resurrects old proof'; END IF;
END $$;
INSERT INTO accordly.deletion_jobs(organization_id,project_id) VALUES('org_test_a','test_a');
RESET ROLE;
SET LOCAL ROLE accordly_maintenance;
SELECT accordly.process_retention(100);
RESET ROLE;
DO $$ BEGIN
 IF EXISTS(SELECT FROM accordly.projects WHERE id='test_a') THEN RAISE EXCEPTION 'Deletion failed'; END IF;
 IF NOT EXISTS(SELECT FROM accordly.projects WHERE id='test_b') THEN RAISE EXCEPTION 'Deletion crossed tenant boundary'; END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname IN('accordly_app','accordly_maintenance') AND (rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION 'Runtime role bypasses RLS'; END IF;
 IF EXISTS(SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='accordly' AND c.relkind='r' AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity)) THEN RAISE EXCEPTION 'RLS missing'; END IF;
END $$;
ROLLBACK;
\echo Isolation, role restrictions, immutable publishing, and deletion checks passed.
