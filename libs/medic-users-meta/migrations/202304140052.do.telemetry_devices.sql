DROP MATERIALIZED VIEW IF EXISTS useview_telemetry_devices;

CREATE MATERIALIZED VIEW public.useview_telemetry_metrics
TABLESPACE pg_default AS 

WITH telemetry_docs_with_metric_blob AS (
 SELECT
    doc #>> '{metadata,deviceId}' AS device_id,
    doc #>> '{_id}' AS telemetry_doc_id,
    doc #>> '{metadata,user}' AS user_name,
    concat_ws(
      '-', doc #>> '{metadata,year}',
      CASE
          WHEN (doc #>> '{metadata,day}') IS NULL AND ((doc #>> '{metadata,versions,app}') IS NULL OR string_to_array("substring"(doc #>> '{metadata,versions,app}', '(\d+.\d+.\d+)'::text), '.'::text)::integer[] < '{3,8,0}'::integer[]) THEN ((doc #>> '{metadata,month}')::integer) + 1
          ELSE (doc #>> '{metadata,month}')::integer
      END,
      CASE
          WHEN (doc #>> '{metadata,day}') IS NOT NULL THEN doc #>> '{metadata,day}'
          ELSE '1'::text
      END
    )::date AS period_start,
    jsonb_object_keys(doc -> 'metrics'::text) AS metric,
    doc -> 'metrics' -> jsonb_object_keys(doc -> 'metrics') AS metric_values
   FROM couchdb_users_meta
   WHERE doc ->> 'type' = 'telemetry'
)

SELECT
  telemetry_docs_with_metric_blob.device_id,
  telemetry_docs_with_metric_blob.telemetry_doc_id,
  telemetry_docs_with_metric_blob.period_start,
  telemetry_docs_with_metric_blob.user_name,
  telemetry_docs_with_metric_blob.metric,
  jsonb_to_record.min,
  jsonb_to_record.max,
  jsonb_to_record.sum,
  jsonb_to_record.count,
  jsonb_to_record.sumsqr
FROM telemetry_docs_with_metric_blob
CROSS JOIN LATERAL jsonb_to_record(telemetry_docs_with_metric_blob.metric_values) jsonb_to_record(min numeric, max numeric, sum numeric, count bigint, sumsqr numeric)

WITH DATA;

CREATE UNIQUE INDEX useview_telemetry_metrics_docid_metric ON public.useview_telemetry_metrics USING btree (telemetry_doc_id, metric);
CREATE INDEX useview_telemetry_metrics_period_start ON public.useview_telemetry_metrics USING btree (period_start);
CREATE INDEX useview_telemetry_metrics_device_id ON public.useview_telemetry_metrics USING btree (device_id);
CREATE INDEX useview_telemetry_metrics_user_name ON public.useview_telemetry_metrics USING btree (user_name);
