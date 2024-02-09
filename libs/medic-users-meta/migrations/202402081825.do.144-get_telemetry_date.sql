DROP FUNCTION IF EXISTS get_telemetry_date(TEXT,TEXT,TEXT,TEXT) CASCADE;
CREATE OR REPLACE FUNCTION get_telemetry_date(app_version TEXT, YEAR TEXT, MONTH TEXT, DAY TEXT) RETURNS date 
AS $$
BEGIN
    RETURN (
        CASE 
            WHEN COALESCE(YEAR,'')='' THEN NULL
            ELSE
                CONCAT_WS(
                    '-',
                    YEAR,
                    CASE
                        WHEN COALESCE(DAY,'')='' AND (COALESCE(app_version,'') ='' OR string_to_array(substring(app_version, '(\d+.\d+.\d+)'), '.')::integer[] < '{3,8,0}'::integer[])
                        THEN (MONTH::int + 1)::text
                        ELSE MONTH
                    END,
                    COALESCE(DAY,'1')
                )::date
        END
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;