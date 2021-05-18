-- Drop views with wrong indexes and definitions that were
-- created at ../deprecated/202102191153.do.54-create-couchdb-users-meta-table.sql
--
-- The views are created again at ../202105171933.do.86.userMetaViews.sql

DROP MATERIALIZED VIEW IF EXISTS useview_feedback;
DROP MATERIALIZED VIEW IF EXISTS useview_telemetry;
