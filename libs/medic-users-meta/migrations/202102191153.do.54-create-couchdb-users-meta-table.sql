CREATE TABLE IF NOT EXISTS couchdb_users_meta (doc jsonb);

DROP MATERIALIZED VIEW IF EXISTS useview_feedback;
CREATE MATERIALIZED VIEW useview_feedback AS
SELECT 
    doc->>'_id' AS uuid,
    doc#>>'{meta,source}' AS SOURCE,    
    doc#>>'{meta,url}' AS url,
    doc#>>'{meta,user,name}' AS user_name,
    doc#>>'{meta,time}' AS period_start,
    doc#>>'{info,cause}' AS cause,
    doc#>>'{info,message}' AS message
FROM
    couchdb_users_meta
WHERE
    doc->>'type'='feedback';

CREATE UNIQUE INDEX idx_useview_feedback_period_start_user ON useview_feedback(period_start,user_name);

CREATE MATERIALIZED VIEW useview_telemetry AS
SELECT 
    doc->>'_id' AS uuid,
    CONCAT(
    doc#>>'{metadata,year}',
    '-',
    CASE WHEN 
            string_to_array(substring(doc#>>'{metadata,versions,app}' FROM '(\d+.\d+.\d+)'),'.')::int[] < '{3,8,0}'::int[] THEN 
            (doc#>>'{metadata,month}')::int 
        ELSE 
            (doc#>>'{metadata,month}')::int+1 END,
    '-1')::date AS period_start,
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

CREATE UNIQUE INDEX idx_useview_telemetry_period_start_user ON useview_telemetry(period_start,user_name);
