const { expect } = require('chai');
const PouchDB = require('../libs/db');
const pgutils = require('./utils/pgutils');
const replicate = require('../libs/replicate');

const couchUrl = `${process.env.TEST_COUCH_URL}/mycouch`;
const pgDbName = 'pgusertest';
const pgUrl = `${process.env.TEST_PG_URL}/${pgDbName}`;

const pouch = () => new PouchDB(`${process.env.TEST_COUCH_URL}/mycouch`);

const cleanUp = async () => {
  await pouch().destroy();
  await pgutils.ensureDbIsClean(pgUrl);
};

const opts = {
  timesToRun: 1,
  syncUsersDb: true,
};

const fakeUserDoc = {
  _id: 'org.couchdb.user:test_user',
  _rev: '3-37b63ea82ca461bfa6b3d4cfda7dbf88',
  name: 'test_user',
  type: 'user',
  roles: ['chw'],
  facility_id: 'c0ca5e2b-508a-4ba7-b934-f6e4751223bf',
  password_scheme: 'pbkdf2',
  iterations: 10,
  derived_key: '5ccbfab2b06a67450c3fbcda9fc0f4e27e5ba957',
  salt: '713733ce185df96773d6bd4a860749ee'
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
  
  it('replicates user without security information', async() => {
    await replicate(couchUrl, pgUrl, opts);
    let rows = await pg.rows('couchdb_medic_users');
    expect(rows.length).to.equal(1);
    const [couchRecord, pgRecord] = [fakeUserDoc, rows[0].doc];
    expect(pgRecord.name).to.equal(fakeUserDoc.name);
    expect(pgRecord.role).to.equal(couchRecord.role);
    expect(pgRecord.derived_key).to.be.undefined;
  });
});
