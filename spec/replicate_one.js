const expect = require('chai').expect,
      PouchDB = require('pouchdb'),
      singleMedicDoc = require('./docs/single-medic.json'),
      pgutils = require('./utils/pgutils'),
      medic = require('../libs/medic');

const COUCH_DB_URL = `${process.env.TEST_COUCH_URL}/mycouchonetest`;
const PG_DB_NAME = 'pgonetest';
const PG_DB_URL = `${process.env.TEST_PG_URL}/${PG_DB_NAME}`;

const pouch = () => new PouchDB(COUCH_DB_URL);

const cleanUp = async () => {
  await pouch().destroy();
  await pgutils.ensureDbIsClean(PG_DB_URL);
};

describe('medic without sentinel db replication', () => {
  let pg;

  beforeEach(async () => {
    await cleanUp();
    await pouch().bulkDocs([singleMedicDoc]);
    pg = new pgutils.Pg(PG_DB_URL);
  });

  afterEach(async() => {
    await pg.destroy();
  });

  it('replicates single couch record to postgres', async() => {
    await medic(COUCH_DB_URL).replicateTo(PG_DB_URL, 1);
    let rows = await pg.rows();
    expect(rows.length).to.equal(1);
    const [couchRecord, pgRecord] = [singleMedicDoc, rows[0].doc];
    expect(pgRecord.sex).to.equal(couchRecord.sex);
    expect(pgRecord.role).to.equal(couchRecord.role);
    expect(pgRecord.type).to.equal(couchRecord.type);

    // Update couch record
    const couch = new PouchDB(COUCH_DB_URL);
    const doc = await couch.get(couchRecord._id);
    doc.name = 'Simon Says';
    await couch.put(doc);

    // Replicate again
    await medic(COUCH_DB_URL).replicateTo(PG_DB_URL, 1);
    rows = await pg.rows();
    expect(rows.length).to.equal(1); // Still one pg record
    expect(rows[0].doc.name).to.equal(doc.name); // pg record has been updated
  });
});
