-- a function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_matviews() RETURNS INTEGER AS $$
DECLARE
  matview RECORD;
  start_time TIMESTAMPTZ;
BEGIN
  RAISE NOTICE 'Refreshing base metaviews';
  -- other matviews rely on contactview_metadata, which is a matview
  -- so load this first
  REFRESH MATERIALIZED VIEW CONCURRENTLY contactview_metadata;
  FOR matview IN SELECT matviewname FROM pg_catalog.pg_matviews LOOP
    IF matview.matviewname = 'contactview_metadata' THEN
      -- this one is already done, skip it.
      CONTINUE;
    END IF;
    RAISE NOTICE 'Refreshing %', matview.matviewname;
    start_time := clock_timestamp();
    EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', matview.matviewname);
    RAISE INFO 'Finished refreshing % took %', matview.matviewname, clock_timestamp() - start_time;
  END LOOP;
  RAISE NOTICE 'Materialized views refreshed.';
  RETURN 1;
END;
$$ LANGUAGE plpgsql;
