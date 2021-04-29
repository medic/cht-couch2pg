-- Recreates the view only to add the new column contact_type
DROP MATERIALIZED VIEW IF EXISTS contactview_metadata CASCADE;
CREATE MATERIALIZED VIEW contactview_metadata AS
  SELECT doc->>'_id' AS uuid,
    doc->>'name' AS name,
    doc->>'type' AS type,
    doc->>'contact_type' AS contact_type,       --> only this is new
    doc#>>'{contact,_id}' AS contact_uuid,
    doc#>>'{parent,_id}' AS parent_uuid,
    doc->>'notes' AS notes,
    TIMESTAMP WITH TIME ZONE 'epoch' + (doc->>'reported_date')::numeric / 1000 * interval '1 second' AS reported
  FROM raw_contacts;

CREATE UNIQUE INDEX contactview_metadata_uuid ON contactview_metadata (uuid);
CREATE INDEX contactview_metadata_contact_uuid ON contactview_metadata (contact_uuid);
CREATE INDEX contactview_metadata_parent_uuid ON contactview_metadata (parent_uuid);
CREATE INDEX contactview_metadata_type ON contactview_metadata (type);

-- NOTE: The recreation of the view above caused 4 other views to be dropped in cascade,
--       here are the scripts to recreate them:

CREATE VIEW contactview_hospital AS
  SELECT cmd.uuid, cmd.name
    FROM contactview_metadata AS cmd
    WHERE cmd.type = 'district_hospital';

CREATE VIEW contactview_chw AS
  SELECT chw.name, pplfields.*, chwarea.uuid AS area_uuid,
         chwarea.parent_uuid AS branch_uuid
    FROM contactview_person_fields AS pplfields
         INNER JOIN contactview_metadata AS chw ON (chw.uuid = pplfields.uuid)
         INNER JOIN contactview_metadata AS chwarea ON (chw.parent_uuid = chwarea.uuid)
    WHERE pplfields.parent_type = 'health_center';

CREATE VIEW contactview_clinic AS
  SELECT cmd.uuid, cmd.name, chw.uuid AS chw_uuid, cmd.reported AS created
    FROM contactview_metadata AS cmd
         INNER JOIN contactview_chw AS chw ON (cmd.parent_uuid = chw.area_uuid)
    WHERE type = 'clinic';

CREATE VIEW contactview_clinic_person AS
  SELECT
      raw_contacts.doc ->> '_id' AS uuid,
      raw_contacts.doc ->> 'name' AS name,
      raw_contacts.doc ->> 'type' AS type,
      raw_contacts.doc #>> '{parent,_id}' AS family_uuid,
      raw_contacts.doc ->> 'phone' AS phone,
      raw_contacts.doc ->> 'alternative_phone' AS phone2,
      raw_contacts.doc ->> 'date_of_birth' AS date_of_birth,
      cmeta.type AS parent_type
    FROM
      raw_contacts
      LEFT JOIN contactview_metadata AS cmeta ON (doc #>> '{parent,_id}' = cmeta.uuid)
    WHERE
      raw_contacts.doc->>'type' = 'person' AND
      raw_contacts.doc->>'_id' IN (SELECT contact_uuid FROM contactview_metadata WHERE type = 'clinic');
