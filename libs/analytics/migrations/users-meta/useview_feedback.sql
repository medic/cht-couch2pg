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
    couchdb
WHERE
    doc->>'type'='feedback';

CREATE UNIQUE INDEX idx_useview_feedback_period_start_user ON useview_feedback(period_start,user_name);

ALTER MATERIALIZED VIEW useview_feedback OWNER TO full_access;
