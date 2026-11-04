CREATE FUNCTION accordly.invalidate_domain_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN
 IF NEW.domain IS DISTINCT FROM OLD.domain THEN
  UPDATE accordly.domain_challenges SET verified_at=NULL WHERE project_id=OLD.id AND organization_id=OLD.organization_id;
  NEW.active_release:=NULL;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION accordly.invalidate_domain_change() FROM PUBLIC;
CREATE TRIGGER invalidate_domain_change BEFORE UPDATE OF domain ON accordly.projects FOR EACH ROW EXECUTE FUNCTION accordly.invalidate_domain_change();
