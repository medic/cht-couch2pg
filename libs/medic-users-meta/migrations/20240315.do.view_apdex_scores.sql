CREATE VIEW view_apdex_scores AS
WITH apdex_telemetry_data AS (
  SELECT
    substring(metric from '^(.*):apdex:') AS event_category,
    CASE
      WHEN metric LIKE '%:satisfied' THEN 'satisfied'
      WHEN metric LIKE '%:tolerable' THEN 'tolerable'
      WHEN metric LIKE '%:frustrated' THEN 'frustrated'
    END AS event_type,
    SUM(count) AS event_count
  FROM
    useview_telemetry_metrics
  WHERE metric LIKE '%:apdex:%'
  GROUP BY event_category, event_type
), 
apdex_scores AS (
  SELECT
    event_category,
    SUM(CASE WHEN event_type = 'satisfied' THEN event_count ELSE 0 END) AS satisfied_count,
    SUM(CASE WHEN event_type = 'tolerable' THEN event_count ELSE 0 END) AS tolerable_count,
    SUM(CASE WHEN event_type = 'frustrated' THEN event_count ELSE 0 END) AS frustrated_count,
    SUM(event_count) AS total_event_count
  FROM apdex_telemetry_data
  GROUP BY event_category
)
SELECT
  event_category,
  satisfied_count,
  tolerable_count,
  frustrated_count,
  ROUND(((satisfied_count + (tolerable_count / 2.0)) / total_event_count)::numeric, 2) AS apdex_score
FROM apdex_scores
ORDER BY apdex_score asc;