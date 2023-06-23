const { expect } = require('chai');
const fakeUserDoc = require('./docs/single-user.json');
const PouchDB = require('../libs/db');
const pgutils = require('./utils/pgutils');
const replicate = require('../libs/replicate');

const couchUrl = `${process.env.TEST_COUCH_URL}/mycouch`;
const pgDbName = 'pgusertest';
const pgUrl = `${process.env.TEST_PG_URL}/${pgDbName}`;

const pouch = () => new PouchDB(`${process.env.TEST_COUCH_URL}/_users`);

const cleanUp = async () => {
  await pouch().destroy();
  await pgutils.ensureDbIsClean(pgUrl);
};

const opts = {
  timesToRun: 1,
  syncUsersDb: true,
};

describe('medic _users db replication', () => {
  let pg;

  beforeEach(async () => {
    await cleanUp();
    await pouch().bulkDocs([fakeUserDoc]);
    pg = new pgutils.Pg(pgUrl);
  });

  afterEach(async() => {
    await pg.destroy();
  });

  it('can skip replication', async() => {
    await replicate(couchUrl, pgUrl, { timesToRun: 1 });
    const rows = await pg.rows('couchdb_medic_users');
    expect(rows.length).to.equal(0);
  });
  
  it('replicates _user record without security information', async() => {
    await replicate(couchUrl, pgUrl, opts);
    const rows = await pg.rows('couchdb_medic_users');
    expect(rows.length).to.equal(1);

    const pgRecord = rows[0].doc;
    expect(pgRecord.name).to.equal(fakeUserDoc.name);
    expect(pgRecord.role).to.deep.equal(fakeUserDoc.role);
    expect(pgRecord.derived_key).to.be.undefined;
  });
});
