const expect = require('chai').expect,
      PouchDB = require('../libs/db'),
      singleMedicDoc = require('./docs/single-medic.json'),
      pgutils = require('./utils/pgutils'),
      replicate = require('../libs/replicate');

const couchUrl = `${process.env.TEST_COUCH_URL}/mycouchsinglerecordtest`;
const pgDbName = 'pgsinglerecordtest';
const pgUrl = `${process.env.TEST_PG_URL}/${pgDbName}`;

const pouch = () => new PouchDB(couchUrl);

const opts = {
  timesToRun: 1,
  syncMedicDb: true,
};

const cleanUp = async () => {
  await pouch().destroy();
  await pgutils.ensureDbIsClean(pgUrl);
};

describe('medic without sentinel db replication', () => {
  let pg;

  beforeEach(async () => {
    await cleanUp();
    await pouch().bulkDocs([singleMedicDoc]);
    pg = new pgutils.Pg(pgUrl);
  });

  afterEach(async() => {
    await pg.destroy();
  });

  it('medic replication can be skipped', async() => {
    await replicate(couchUrl, pgUrl, { timesToRun: 1 });
    let rows = await pg.rows('couchdb');
    expect(rows.length).to.equal(1);
  });

  it('replicates single couch record to postgres', async() => {
    await replicate(couchUrl, pgUrl, opts);
    let rows = await pg.rows('couchdb');
    expect(rows.length).to.equal(1);
    const [couchRecord, pgRecord] = [singleMedicDoc, rows[0].doc];
    expect(pgRecord.sex).to.equal(couchRecord.sex);
    expect(pgRecord.role).to.equal(couchRecord.role);
    expect(pgRecord.type).to.equal(couchRecord.type);

    // Update couch record
    const couch = new PouchDB(couchUrl);
    const doc = await couch.get(couchRecord._id);
    doc.name = 'Simon Says';
    await couch.put(doc);

    // Replicate again
    await replicate(couchUrl, pgUrl, opts);
    rows = await pg.rows('couchdb');
    expect(rows.length).to.equal(1); // Still one pg record
    expect(rows[0].doc.name).to.equal(doc.name); // pg record has been updated
  });
});
