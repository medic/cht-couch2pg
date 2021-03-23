const knex = require('knex');
const url = require('url');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const WAIT_TIME = 5000;
const MAX_RETRIES = 10;

const PUBLIC_ANNOUNCEMENT =
'-------------------------------------------------------------------\n \
  * To test against your local databases (couch/postgres),\n\
   please define these env vars:\n\n \
    TEST_COUCH_URL (ie: http://admin:pass@localhost:5984) &\n \
    TEST_PG_URL    (ie: postgres://locahost:5432)\n\n\n\
  * Everything can also be tested with:\n\n\
    docker-compose run test grunt test\n\n\
-----------------------------------------------------------------';

const waitForDb = async ({ dbUrl, fn, retries=0 }) => {
  if(retries ++ >= MAX_RETRIES) {
    console.log(`****** ERROR: Unable to connect: ${dbUrl}`);
    process.exit(1);
  }

  if(!await fn()) {
    if(!dbUrl) {
      console.log(PUBLIC_ANNOUNCEMENT);
      process.exit(1);
    }
    console.log(`====> Waiting on ${dbUrl} to appear.`);
    await wait(WAIT_TIME);
    await waitForDb({ dbUrl, fn, retries });
  }
};

const waitForCouch = async (dbUrl) => {
  await waitForDb({ dbUrl, fn: async () => {
    try {
      const result = await isDBReady(dbUrl);
      const log = result.ready ? `- Couch [${dbUrl}] is now available.` : result.error;
      console.log(log);
      return result.ready;

    } catch (err) {
      //Ignore
      console.log(err);
    }
  } });
};

const waitForPg = async (dbUrl) => {
  const conn = knex({client: 'pg', connection: dbUrl});
  await waitForDb({ dbUrl, fn: async () => {
    try {
      await conn.raw('SELECT * FROM pg_catalog.pg_tables');
      console.log(`- Postgres [${dbUrl}] is now available.`);
      await conn.destroy();
      return true;
    } catch(err) {
      if(err.code !== 'ECONNREFUSED') {
        console.log(err);
        process.exit(1);
      }
    }
  } });
};

const isDBReady = (dbUrl) => {
  const parsed = new url.URL(dbUrl);
  const http = parsed.protocol === 'https:' ? require('https') : require('http');

  return new Promise((resolve) => {
    http
        .get(dbUrl, res => {
          resolve({ ready: res.statusCode === 200 });
        })
        .on('error', (error) => {
          resolve({ ready: false, error });
        });
  });
};

before(async () => {
  if (!process.env.TEST_COUCH_URL) {
    throw new Error('TEST_COUCH_URL is undefined.');
  }

  if (!process.env.TEST_PG_URL) {
    throw new Error('TEST_PG_URL is undefined.');
  }

  await waitForCouch(process.env.TEST_COUCH_URL);
  await waitForPg(process.env.TEST_PG_URL);
});
