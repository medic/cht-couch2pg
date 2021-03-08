const expect = require('chai').expect,
      PouchDB = require('../libs/db'),
      singleMedicDoc = require('./docs/single-medic.json'),
      medicDocs = require('./docs/medic.json'),
      sentinelDocs = require('./docs/sentinel.json'),
      pgutils = require('./utils/pgutils'),
      replicate = require('../libs/replicate');

const couchUrl = `${process.env.TEST_COUCH_URL}/mycouchtest`;
const sentinelUrl = `${couchUrl}-sentinel`;
const pgDbName = 'mypgtest';
const pgUrl = `${process.env.TEST_PG_URL}/${pgDbName}`;

const pouch = () => new PouchDB(couchUrl);
const sentinel = () => new PouchDB(sentinelUrl);

const cleanUp = async () => {
  await pouch().destroy();
  await sentinel().destroy();
  await pgutils.ensureDbIsClean(pgUrl);
};

describe('replication', () => {
  let pg;

  beforeEach(async () => {
    await cleanUp();
    await pouch().bulkDocs(medicDocs);
    await sentinel().bulkDocs(sentinelDocs);
    pg = new pgutils.Pg(pgUrl);
  });

  afterEach(async () => {
    await pg.destroy();
  });

  it('replicates different type of couch records to pg', async () => {
    await replicate(couchUrl, pgUrl, {timesToRun:1});
    const totalMedicDocs = medicDocs.length + sentinelDocs.length;
    expect((await pg.rows('couchdb')).length).to.equal(totalMedicDocs);

    //Insert new couch doc
    const couch = new PouchDB(couchUrl);
    await couch.put(singleMedicDoc);

    // Replicate again and expect one more doc
    await replicate(couchUrl, pgUrl, {timesToRun:1});
    expect((await pg.rows('couchdb')).length).to.equal(totalMedicDocs + 1);
  });

});
