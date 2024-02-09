DROP MATERIALIZED VIEW IF EXISTS useview_telemetry CASCADE;

CREATE MATERIALIZED VIEW useview_telemetry AS
SELECT 
    doc->>'_id' AS uuid,
    get_telemetry_date(doc#>>'{metadata,versions,app}',doc#>>'{metadata,year}',doc#>>'{metadata,month}',doc#>>'{metadata,day}') AS period_start,
    doc#>>'{metadata,user}' AS user_name,
    doc#>>'{metadata,versions,app}' AS app_version,
    doc#>>'{metrics,boot_time,min}' AS boot_time_min,
    doc#>>'{metrics,boot_time,max}' AS boot_time_max,
    doc#>>'{metrics,boot_time,count}' AS boot_time_count,
    doc#>>'{dbInfo,doc_count}' AS doc_count_on_local_db
FROM
    couchdb_users_meta
WHERE
    doc->>'type'='telemetry';

CREATE UNIQUE INDEX idx_useview_telemetry_uuid ON useview_telemetry(uuid);
CREATE INDEX idx_useview_telemetry_period_start_user ON useview_telemetry(period_start,user_name);
