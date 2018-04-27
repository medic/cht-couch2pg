--Replaces -> https://github.com/medic/medic-couch2pg/blob/dd5638134e9c0d6868e766619d326c13caedf60a/libs/xmlforms/migrations/201606200952.do.2318-prepareContacts.sql#L63-L76
--This view had a reference to raw_contacts.doc#>>'{parent,type}' which is
--not available in 2.13 and above (from medic-webapp/issues/2635).
CREATE OR REPLACE VIEW contactview_clinic_person AS
(
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
		(raw_contacts.doc ->> 'type') = 'person' AND
		(raw_contacts.doc ->> '_id') IN (SELECT contact_uuid FROM contactview_metadata WHERE type = 'clinic')
);


--Replaces -> https://github.com/medic/medic-couch2pg/blob/dd5638134e9c0d6868e766619d326c13caedf60a/libs/xmlforms/migrations/201606200952.do.2318-prepareContacts.sql#L36-L45
--This view had a reference to raw_contacts.doc#>>'{parent,type}' which is
--not available in 2.13 and above (from medic-webapp/issues/2635).
CREATE OR REPLACE VIEW contactview_person_fields AS
(
	SELECT
		person.doc->>'_id' AS uuid,
		person.doc->>'phone' AS phone,
		person.doc->>'alternative_phone' AS phone2,
		person.doc->>'date_of_birth' AS date_of_birth,
		parent.doc->>'type' AS parent_type

	FROM
		raw_contacts AS person
		LEFT JOIN raw_contacts AS parent ON (person.doc#>>'{parent,_id}' = parent.doc->>'_id')

	WHERE
		person.doc->>'type' = 'person'
);
