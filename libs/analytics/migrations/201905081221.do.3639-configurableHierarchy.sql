-- filter contact docs into one place
CREATE OR REPLACE VIEW raw_contacts AS SELECT * FROM couchdb WHERE doc->>'type' IN ('contact', 'clinic', 'district_hospital', 'health_center', 'person');
