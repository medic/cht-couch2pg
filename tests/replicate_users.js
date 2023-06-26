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
    await replicate(couchUrl, pgUrl, {
      timesToRun: 1,
      syncUsersDb: true,
    });
    const rows = await pg.rows('couchdb_medic_users');
    expect(rows.length).to.equal(1);

    const pgRecord = rows[0].doc;
    expect(pgRecord.name).to.equal(fakeUserDoc.name);
    expect(pgRecord.role).to.deep.equal(fakeUserDoc.role);

    // package couch2pg 0.7.1 removes security information from users docs
    expect(pgRecord).to.have.keys('_id', 'name', 'type', 'roles', 'facility_id', 'iterations');
    expect(pgRecord).to.not.have.any.keys('derived_key', 'salt', `password_scheme`);
  });
});
