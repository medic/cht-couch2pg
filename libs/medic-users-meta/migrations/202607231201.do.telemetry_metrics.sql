-- CASCADE is intentionally avoided. If any objects depend on it, users should take backup of those and drop, execute this, and restore

DROP MATERIALIZED VIEW IF EXISTS useview_telemetry_metrics;

CREATE MATERIALIZED VIEW public.useview_telemetry_metrics
TABLESPACE pg_default AS
WITH docs AS MATERIALIZED (
  SELECT doc #>> '{_id}'               AS telemetry_doc_id,
         doc #>> '{metadata,deviceId}' AS device_id,
         doc #>> '{metadata,user}'     AS user_name,
         get_telemetry_date(
           doc #>> '{metadata,versions,app}',
           doc #>> '{metadata,year}',
           doc #>> '{metadata,month}',
           doc #>> '{metadata,day}')    AS period_start,
         doc -> 'metrics'              AS metrics
  FROM couchdb_users_meta
  WHERE doc ->> 'type' = 'telemetry'
)
SELECT d.telemetry_doc_id,
       m.key AS metric,
       d.period_start,
       d.user_name,
       d.device_id,
       r.min, r.max, r.sum, r.count, r.sumsqr
FROM docs d
CROSS JOIN LATERAL jsonb_each(d.metrics)    AS m(key, value)
CROSS JOIN LATERAL jsonb_to_record(m.value) AS r(min numeric, max numeric, sum numeric, count bigint, sumsqr numeric)
WITH DATA;

CREATE UNIQUE INDEX useview_telemetry_metrics_docid_metric ON public.useview_telemetry_metrics USING btree (telemetry_doc_id, metric);
CREATE INDEX useview_telemetry_metrics_period_start ON public.useview_telemetry_metrics USING btree (period_start);
CREATE INDEX useview_telemetry_metrics_device_id  ON public.useview_telemetry_metrics USING btree (device_id);
CREATE INDEX useview_telemetry_metrics_user_name  ON public.useview_telemetry_metrics USING btree (user_name);
