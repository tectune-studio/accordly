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
SELECT accordly.activate_release('test_a','test_release');
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
