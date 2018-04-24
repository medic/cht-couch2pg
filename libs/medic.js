const urlParser = require('url')
      , PouchDB = require('pouchdb')
      , env = require('../env')()
      , xmlforms = require('./xmlforms')
      , couch2pg = require('couch2pg')
      , {delayLoop} = require('./delay')
      , pgp = require('pg-promise')
      , Promise = require('rsvp').Promise
      , log = require('./log');

// Removes credentials from couchdb url
// Converts http://admin:pass@localhost:5984/couch1
// to localhost:5984/couch1 -- seq source
const parseSource = url => {
  const source = urlParser.parse(url);
  return `${source.host}${source.path}`;
};

const pg = (pgconn) => {
  return {
    importAll: (couchUrl) => {
      return couch2pg.importer(
        pgconn,
        new PouchDB(couchUrl),
        env.couch2pgDocLimit,
        env.couch2pgChangesLimit,
        parseSource(couchUrl));
    }
  };
};

let firstRun = false;
let errorCount = 0;
let runTimes = 0;
let legacyRunTimes = 0;

const legacyRun = async (couchUrl, pgconn, timesToRun=undefined) => {
  log.info('Beginning couch2pg run at ' + new Date());
  try {
    await couch2pg.importer(
      pgconn,
      new PouchDB(couchUrl),
      env.couch2pgDocLimit,
      env.couch2pgChangesLimit,
      parseSource(couchUrl));

    if(!timesToRun || ++legacyRunTimes < timesToRun) {
      await delayLoop();
      await legacyRun();
    }
  } catch(err) {
    log.error('Couch2PG import failed');
    log.error(err);
    await delayLoop(true);
  }
};

const run = async (couchUrl, pgconn, timesToRun=undefined) => {
  log.info('Beginning couch2pg and xmlforms run at ' + new Date());
  let runErrored = false;
  let allResults = [];
  try {
    allResults = [
        await pg(pgconn).importAll(couchUrl).importAll()
      , await pg(pgconn).importAll(`${couchUrl}-sentinel`).importAll()
    ];
  } catch(err) {
    log.error('Couch2PG import failed');
    log.error(err);
    if (err  && err.status === 401){
      process.exit(1);
    }
    runErrored = true;
  }
  if(allResults) {
    const [results, sentinelResults] = allResults;
    // Run secondary tasks if we reasonably think there might be new data
    // runErrored || errorCount <- something went wrong, but maybe there is still new data
    // firstRun <- this is first run, we don't know what the DB state is in
    // results.deleted.length || results.edited.length <- data has changed
    if (runErrored || errorCount || firstRun ||
        results.deleted.length || results.edited.length ||
        sentinelResults.deleted.length || sentinelResults.edited.length) {
      try {
        await xmlforms.update(pgconn);
        // We have completed a successful run
        firstRun = false;
      } catch(err) {
        log.error('XMLForms support failed');
        log.error(err);
        runErrored = true;
      }
    }
  }

  if(runErrored) {
    if (errorCount++ === env.couch2pgRetryCount) {
      throw new Error('Too many consecutive errors');
    }
  } else {
    errorCount = 0;
  }

  if(!timesToRun || ++runTimes < timesToRun) {
    await delayLoop(runErrored, env.sleepMs);
    await run(couchUrl, pgconn, timesToRun);
  }
};

const replicate = async (couchUrl, pgUrl, timesToRun=undefined) => {
  try {
    await couch2pg.migrator(pgUrl)();
    const pgconn = pgp({ 'promiseLib': Promise })(pgUrl);
    if (env.v04Mode) {
      log.info('Adapter is running in 0.4 mode');
      await legacyRun(couchUrl, pgconn, timesToRun);
    } else {
      log.info('Adapter is running in NORMAL mode');
      await xmlforms.migrate(pgUrl);
      await run(couchUrl, pgconn, timesToRun);
    }
  } catch(err) {
    log.error('An unrecoverable error occurred');
    log.error(err);
    log.error('exiting');
    process.exit(1);
  }
};

module.exports = couchUrl => {
  return {
    replicateTo: (pgUrl, times) => replicate(couchUrl, pgUrl, times)
  };
};
