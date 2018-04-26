const expect = require('chai').expect,
      PouchDB = require('pouchdb'),
      medicDocs = require('./docs/medic.json'),
      sentinelDocs = require('./docs/sentinel.json'),
      knex = require('knex'),
      pgutils = require('./utils/pgutils'),
      medic = require('../libs/medic');

const COUCH_DB_URL = `${process.env.TEST_COUCH_URL}/mycouchtest`;
const SENTINEL_DB_URL = `${COUCH_DB_URL}-sentinel`;
const PG_DB_NAME = 'mypgtest';
const PG_DB_URL = `${process.env.TEST_PG_URL}/${PG_DB_NAME}`;

const pouch = () => new PouchDB(COUCH_DB_URL);
const sentinel = () => new PouchDB(SENTINEL_DB_URL);

const cleanUp = async () => {
  await pouch().destroy();
  await sentinel().destroy();
  await pgutils.ensureDbIsClean(PG_DB_URL);
};

describe('replication', () => {
  beforeEach(async () => {
    await cleanUp();
    await pouch().bulkDocs(medicDocs);
    await sentinel().bulkDocs(sentinelDocs);
  });

  it('replicates', async () => {
    expect(medicDocs.length + sentinelDocs.length).to.equal(4);

    await medic(COUCH_DB_URL).replicateTo(PG_DB_URL, 1);
    const pgconn = knex({client: 'pg', connection: PG_DB_URL});
    let rows = await pgconn.raw('select * from couchdb');
    expect(rows.rowCount).to.equal(4);//Avoids view
    await pgconn.destroy();
  });
});
