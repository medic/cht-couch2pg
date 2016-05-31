-- get everyone to baseline what existed before we added migrations
CREATE TABLE IF NOT EXISTS couchdb (doc jsonb);
-- Change the below to use 9.4-style workaround for if not exists
-- ie a JS function that checks before creating
CREATE INDEX IF NOT EXISTS couchdb_doc_uuid ON couchdb ( (%I->>'_id') );
CREATE INDEX IF NOT EXISTS couchdb_doc_type ON couchdb ( (%I->>'type') );
CREATE INDEX IF NOT EXISTS couchdb_doc_attachments ON couchdb USING GIN ( (%I->'_attachments') );
