-- get_telemetry_date: derive the telemetry period_start date from metadata. Null-safe: returns NULL when year is missing/empty (avoids the '1'::date error).
-- Fixed on some instances already via #145, now releasing it on all
CREATE OR REPLACE FUNCTION get_telemetry_date(app_version text, year text, month text, day text)
RETURNS date
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN COALESCE(year, '') = '' THEN NULL
    ELSE concat_ws('-',
           year,
           CASE
             WHEN COALESCE(day, '') = ''
                  AND (COALESCE(app_version, '') = ''
                       OR string_to_array(substring(app_version, '(\d+.\d+.\d+)'), '.')::integer[] < '{3,8,0}'::integer[])
             THEN (month::int + 1)::text
             ELSE month
           END,
           COALESCE(day, '1')
         )::date
  END
$$;
