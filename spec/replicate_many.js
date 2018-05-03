const expect = require('chai').expect,
      PouchDB = require('pouchdb'),
      singleMedicDoc = require('./docs/single-medic.json'),
      medicDocs = require('./docs/medic.json'),
      sentinelDocs = require('./docs/sentinel.json'),
      pgutils = require('./utils/pgutils'),
      medic = require('../libs/medic');

const COUCH_DB_URL = `${process.env.TEST_COUCH_URL}/mycouchtest`;
const SENTINEL_DB_URL = `${COUCH_DB_URL}-sentinel`;
const PG_DB_NAME = 'xmypgtest';
const PG_DB_URL = `${process.env.TEST_PG_URL}/${PG_DB_NAME}`;

const pouch = () => new PouchDB(COUCH_DB_URL);
const sentinel = () => new PouchDB(SENTINEL_DB_URL);

const cleanUp = async () => {
  await pouch().destroy();
  await sentinel().destroy();
  await pgutils.ensureDbIsClean(PG_DB_URL);
};

describe('replication', () => {
  let pg;

  beforeEach(async () => {
    await cleanUp();
    await pouch().bulkDocs(medicDocs);
    await sentinel().bulkDocs(sentinelDocs);
    pg = new pgutils.Pg(PG_DB_URL);
  });

  afterEach(async () => {
    await pg.destroy();
  });

  it('replicates different type of couch records to pg', async () => {
    await medic(COUCH_DB_URL).replicateTo(PG_DB_URL, 1);
    const totalMedicDocs = medicDocs.length + sentinelDocs.length;
    expect((await pg.rows()).length).to.equal(totalMedicDocs);

    //Insert new couch doc
    const couch = new PouchDB(COUCH_DB_URL);
    await couch.put(singleMedicDoc);

    // Replicate again and expect one more doc
    await medic(COUCH_DB_URL).replicateTo(PG_DB_URL, 1);
    expect((await pg.rows()).length).to.equal(totalMedicDocs + 1);
  });

});
