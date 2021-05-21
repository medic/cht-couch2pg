const expect = require('chai').expect,
      PouchDB = require('../libs/db'),
      singleMedicDoc = require('./docs/single-medic.json'),
      medicDocs = require('./docs/medic.json'),
      sentinelDocs = require('./docs/sentinel.json'),
      medicUsersMetaDocs = require('./docs/medic-users-meta.json'),
      singleMedicUsersMetaDocs = require('./docs/single-medic-users-meta.json'),
      pgutils = require('./utils/pgutils'),
      replicate = require('../libs/replicate');

const couchUrl = `${process.env.TEST_COUCH_URL}/mycouchtest`;
const sentinelUrl = `${couchUrl}-sentinel`;
const usersMetaUrl = `${couchUrl}-users-meta`;
const pgDbName = 'mypgtest';
const pgUrl = `${process.env.TEST_PG_URL}/${pgDbName}`;

const pouch = () => new PouchDB(couchUrl);
const sentinel = () => new PouchDB(sentinelUrl);
const usersMeta = () => new PouchDB(usersMetaUrl);

const cleanUp = async () => {
  await pouch().destroy();
  await sentinel().destroy();
  await usersMeta().destroy();
  await pgutils.ensureDbIsClean(pgUrl);
};

describe('replication', () => {
  let pg;

  beforeEach(async () => {
    await cleanUp();
    await pouch().bulkDocs(medicDocs);
    await sentinel().bulkDocs(sentinelDocs);
    await usersMeta().bulkDocs(medicUsersMetaDocs);
    pg = new pgutils.Pg(pgUrl);
  });

  afterEach(async () => {
    await pg.destroy();
  });

  it('replicates different type of couch records to pg', async () => {
    await replicate(couchUrl, pgUrl, {timesToRun:1});
    const totalMedicDocs = medicDocs.length + sentinelDocs.length;
    expect((await pg.rows('couchdb')).length).to.equal(totalMedicDocs);
    expect((await pg.rows('couchdb_users_meta')).length).to.equal(medicUsersMetaDocs.length);

    //Insert new couch doc for main and meta dbs
    const couch = new PouchDB(couchUrl);
    await couch.put(singleMedicDoc);
    const metaCouch = new PouchDB(usersMetaUrl);
    await metaCouch.put(singleMedicUsersMetaDocs);

    // Replicate again and expect one more doc
    await replicate(couchUrl, pgUrl, {timesToRun:1});
    expect((await pg.rows('couchdb')).length).to.equal(totalMedicDocs + 1);
    expect((await pg.rows('couchdb_users_meta')).length).to.equal(medicUsersMetaDocs.length + 1);
  });

});
