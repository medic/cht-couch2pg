const couch2pg = require('../couch2pg'),
      log = require('./log'),
      safe = require('./safe'),
      analytics = require('../analytics'),
      {delayLoop} = require('./delay');

let firstRun = false;
let errorCount = 0;
let runTimes = 0;

const replicateAll = async (couchUrl, pgconn, opts) => {
  const results = [];
  let runErrored = false;

  const replicateDatabase = async (url, table) => {
    const result = await couch2pg.replicate(url, pgconn, opts, table);
    results.push(result);
  };

  try {
    opts.docLimit = opts.couchdbUsersMetaDocLimit;
    
    if (opts.syncMedicDb) {
      await replicateDatabase(couchUrl, 'couchdb');
    }

    if (opts.syncSentinelDb) {
      await replicateDatabase(`${couchUrl}-sentinel`, 'couchdb');
    }

    if (opts.syncUserMetaDb) {
      await replicateDatabase(`${couchUrl}-users-meta`, 'couchdb_users_meta');
    }

    if (opts.syncLogsDb) {
      await replicateDatabase(`${couchUrl}-logs`, 'couchdb_medic_logs');
    }
  } catch(err) {
    log.error('Couch2PG import failed');
    log.error(err);
    if (err  && err.status === 401){
      process.exit(1);
    }
    runErrored = true;
  }
  return [results, runErrored];
};

const run = async (couchUrl, pgconn, opts) => {
  log.info('Beginning couch2pg and xmlforms run at ' + new Date());
  const [results, runErrored] = await replicateAll(couchUrl, pgconn, opts);
  if(results) {
    // Run secondary tasks if we reasonably think there might be new data
    // runErrored || errorCount <- something went wrong, but maybe there is still new data
    // firstRun <- this is first run, we don't know what the DB state is in
    // results.deleted.length || results.edited.length <- data has changed

    const resultHasDataChanged = result => result && (result.deleted.length || result.edited.length);
    if (
      runErrored ||
      errorCount ||
      firstRun ||
      results.some(resultHasDataChanged)
    ) {
      try {
        await analytics.update(pgconn);
        // We have completed a successful run
        firstRun = false;
      } catch(err) {
        log.error('XMLForms support failed');
        log.error(err);
        runErrored = true;
      }
    }
  }

  const retries = opts.retryCount;
  if(!runErrored) {
    errorCount = 0;
  } else if(retries > 0 && errorCount++ >= retries) {
    throw new Error('Too many consecutive errors');
  }

  log.debug(safe(opts));
  if(!opts.timesToRun || ++runTimes < opts.timesToRun) {
    await delayLoop(runErrored, opts.sleepMins);
    await run(couchUrl, pgconn, opts);
  }
};

module.exports = {
  run: run
};
