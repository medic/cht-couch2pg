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

  const replicateDatabase = async (condition, url, table) => {
    const result = !!condition && await couch2pg.replicate(url, pgconn, opts, table);
    results.push(result);
  };

  try {
    opts.docLimit = opts.couchdbUsersMetaDocLimit;
    
    await replicateDatabase(opts.syncMedicDb, couchUrl, 'couchdb');

    const sentinelUrl = `${couchUrl}-sentinel`;
    await replicateDatabase(opts.syncSentinelDb, sentinelUrl, 'couchdb');

    const usersMetaUrl = `${couchUrl}-users-meta`;
    await replicateDatabase(opts.syncUserMetaDb, usersMetaUrl, 'couchdb_users_meta');
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
    const [medicResult, sentinelResult, usersMetaResult] = results;
    // Run secondary tasks if we reasonably think there might be new data
    // runErrored || errorCount <- something went wrong, but maybe there is still new data
    // firstRun <- this is first run, we don't know what the DB state is in
    // results.deleted.length || results.edited.length <- data has changed

    const resultHasDataChanged = result => result && (result.deleted.length || result.edited.length);
    if (
      runErrored ||
      errorCount ||
      firstRun ||
      resultHasDataChanged(medicResult) ||
      resultHasDataChanged(sentinelResult) ||
      resultHasDataChanged(usersMetaResult)
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
