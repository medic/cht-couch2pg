const { expect } = require('chai');
const PouchDB = require('../libs/db');
const singleMedicDoc = require('./docs/single-medic.json');
const pgutils = require('./utils/pgutils');
const replicate = require('../libs/replicate');

const couchUrl = `${process.env.TEST_COUCH_URL}/mycouch`;
const pgDbName = 'pglogtest';
const pgUrl = `${process.env.TEST_PG_URL}/${pgDbName}`;

const pouch = () => new PouchDB(`${couchUrl}-logs`);

const cleanUp = async () => {
  await pouch().destroy();
  await pgutils.ensureDbIsClean(pgUrl);
};

const opts = {
  timesToRun: 1,
  syncLogsDb: true,
};

describe('medic-logs db replication', () => {
  let pg;

  beforeEach(async () => {
    await cleanUp();
    await pouch().bulkDocs([singleMedicDoc]);
    pg = new pgutils.Pg(pgUrl);
  });

  afterEach(async() => {
    await pg.destroy();
  });

  it('can skip replication', async() => {
    await replicate(couchUrl, pgUrl, { timesToRun: 1 });
    const rows = await pg.rows('couchdb_medic_logs');
    console.log('ROWS', JSON.stringify(rows));
    expect(rows.length).to.equal(0);
  });
  
  it('replicates single couch record to the right table on postgres', async() => {
    await replicate(couchUrl, pgUrl, opts);
    let rows = await pg.rows('couchdb_medic_logs');
    expect(rows.length).to.equal(1);
    const [couchRecord, pgRecord] = [singleMedicDoc, rows[0].doc];
    expect(pgRecord.sex).to.equal(couchRecord.sex);
    expect(pgRecord.role).to.equal(couchRecord.role);
    expect(pgRecord.type).to.equal(couchRecord.type);
  });
});
