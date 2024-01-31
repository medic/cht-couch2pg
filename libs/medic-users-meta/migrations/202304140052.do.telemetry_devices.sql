DROP MATERIALIZED VIEW IF EXISTS useview_telemetry_devices;

CREATE MATERIALIZED VIEW public.useview_telemetry_devices
TABLESPACE pg_default AS 

SELECT
  DISTINCT ON (doc #>> '{metadata,deviceId}', doc #>> '{metadata,user}')
  
  doc #>> '{_id}' AS telemetry_doc_id,
  doc #>> '{metadata,deviceId}' AS device_id,
  doc #>> '{metadata,user}' AS user_name,
  (CASE 
      WHEN doc#>>'{metadata,year}' IS NULL THEN '1970-1-1'
  ELSE
    concat_ws(
      '-',
      doc #>> '{metadata,year}',
      CASE
        WHEN 
          doc #>> '{metadata,day}' IS NULL 
          AND (
            doc #>> '{metadata,versions,app}' IS NULL 
            OR string_to_array("substring"(doc #>> '{metadata,versions,app}', '(\d+.\d+.\d+)'), '.')::integer[] < '{3,8,0}'::integer[]
          ) 
        THEN (doc #>> '{metadata,month}')::integer + 1
        ELSE (doc #>> '{metadata,month}')::integer
      END,
      CASE
        WHEN doc #>> '{metadata,day}' IS NOT NULL 
        THEN doc #>> '{metadata,day}'
        ELSE '1'
      END)
    END)::date AS period_start,
    

  doc #>> '{device,deviceInfo,hardware,manufacturer}' AS device_manufacturer,
  doc #>> '{device,deviceInfo,hardware,model}' AS device_model,
  
  doc #>> '{dbInfo,doc_count}' AS doc_count,
  doc #>> '{device,userAgent}' AS user_agent,
  
  doc #>> '{device,deviceInfo,app,version}' AS cht_android_version,
  doc #>> '{device,deviceInfo,software,androidVersion}' AS android_version,
  
  doc #>> '{device,deviceInfo,storage,free}' AS storage_free,
  doc #>> '{device,deviceInfo,storage,total}' AS storage_total,
  
  doc #>> '{device,deviceInfo,network,upSpeed}' AS network_up_speed,
  doc #>> '{device,deviceInfo,network,downSpeed}' AS network_down_speed
FROM couchdb_users_meta
WHERE doc ->> 'type' = 'telemetry'
ORDER BY 2, 3, 4 ASC

WITH DATA;

CREATE UNIQUE INDEX useview_telemetry_devices_device_user ON public.useview_telemetry_devices USING btree (device_id, user_name);
