const expect = require('chai').expect,
      PouchDB = require('../libs/db'),
      singleMedicDoc = require('./docs/single-medic.json'),
      pgutils = require('./utils/pgutils'),
      replicate = require('../libs/replicate');

const couchUrl = `${process.env.TEST_COUCH_URL}/mycouch`;
const pgDbName = 'pgsinglerecordtest';
const pgUrl = `${process.env.TEST_PG_URL}/${pgDbName}`;

const pouch = () => new PouchDB(`${couchUrl}-users-meta`);

const cleanUp = async () => {
  await pouch().destroy();
  await pgutils.ensureDbIsClean(pgUrl);
};

describe('medic users meta db replication', () => {
  let pg;

  beforeEach(async () => {
    await cleanUp();
    await pouch().bulkDocs([singleMedicDoc]);
    pg = new pgutils.Pg(pgUrl);
  });

  afterEach(async() => {
    await pg.destroy();
  });

  it('replicates single couch record to postgres', async() => {
    await replicate(couchUrl, pgUrl, {timesToRun: 1, couchdbUsersMeta: true});
    let rows = await pg.rows();
    expect(rows.length).to.equal(1);
    const [couchRecord, pgRecord] = [singleMedicDoc, rows[0].doc];
    expect(pgRecord.sex).to.equal(couchRecord.sex);
    expect(pgRecord.role).to.equal(couchRecord.role);
    expect(pgRecord.type).to.equal(couchRecord.type);
  });
});
