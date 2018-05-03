const assert = require('chai').assert,
    analytics = require('../libs/analytics'),
    pgutils = require('./utils/pgutils'),
    couch2pg = require('couch2pg');

const PG_DB_URL = `${process.env.TEST_PG_URL}/xmlformstest`;

const cleanUp = async () => { await pgutils.ensureDbIsClean(PG_DB_URL); };

describe('xmlforms', () => {
  beforeEach(async () => {
    await cleanUp();
  });

  it('checks migrations', async () => {
    await pgutils.ensureDbExists(PG_DB_URL);
    const db = new pgutils.Pg(PG_DB_URL);
    await couch2pg.migrator(PG_DB_URL)();
    assert(await db.schema.hasTable('couchdb'));
    assert(await db.schema.hasTable('couchdb_progress'));
    assert(await db.schema.hasTable('couch2pg_migrations'));

    await analytics.migrate(PG_DB_URL);
    assert(await db.schema.hasTable('xmlforms_migrations'));

    const views = await db.views();
    assert.equal(views[0].table_name, 'contactview_chw');
    assert.equal(views[1].table_name, 'contactview_clinic');
    assert.equal(views[2].table_name, 'contactview_clinic_person');
    assert.equal(views[3].table_name, 'contactview_hospital');
    assert.equal(views[4].table_name, 'contactview_person_fields');
    assert.equal(views[5].table_name, 'raw_contacts');
    await db.destroy();
  });
});
