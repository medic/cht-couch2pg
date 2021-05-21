-- Drop views with wrong indexes and definitions that were
-- created at 202102191153.do.54-create-couchdb-users-meta-table.sql
DROP MATERIALIZED VIEW IF EXISTS useview_feedback;
DROP MATERIALIZED VIEW IF EXISTS useview_telemetry;

-- The views are created again
CREATE MATERIALIZED VIEW useview_feedback AS
SELECT
    doc->>'_id' AS uuid,
    doc#>>'{meta,source}' AS SOURCE,
    doc#>>'{meta,url}' AS url,
    doc#>>'{meta,user,name}' AS user_name,
    doc#>>'{meta,time}' AS period_start,
    COALESCE(doc#>>'{info,cause}',doc->>'info') AS cause,
    doc#>>'{info,message}' AS message
FROM
    couchdb_users_meta
WHERE
    doc->>'type'='feedback';

CREATE UNIQUE INDEX idx_useview_feedback_uuid ON useview_feedback(uuid);  --> Only to allow the refresh of the view CONCURRENTLY
CREATE INDEX idx_useview_feedback_period_start_user ON useview_feedback(period_start,user_name);

CREATE MATERIALIZED VIEW useview_telemetry AS
SELECT
  doc->>'_id' AS uuid,
  CONCAT_WS(                                --> Date concatenation from JSON fields, eg. 2021-5-17
    '-',
    doc#>>'{metadata,year}',                --> year
    CASE                                    --> month of the year
      WHEN
        string_to_array(substring(doc#>>'{metadata,versions,app}' FROM '(\d+.\d+.\d+)'),'.')::int[] < '{3,8,0}'::int[]
      THEN
        (doc#>>'{metadata,month}')::int+1   --> Legacy, months zero-indexed (0 - 11)
      ELSE
        (doc#>>'{metadata,month}')::int     --> Month is between 1 - 12
    END,
    CASE                                    --> day of the month, else 1
      WHEN
        (doc#>>'{metadata,day}') IS NOT NULL
      THEN
        doc#>>'{metadata,day}'
      ELSE
        '1'
    END
  )::date AS period_start,
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

CREATE UNIQUE INDEX idx_useview_telemetry_uuid ON useview_telemetry(uuid);  --> Only to allow the refresh of the view CONCURRENTLY
CREATE INDEX idx_useview_telemetry_period_start_user ON useview_telemetry(period_start,user_name);
