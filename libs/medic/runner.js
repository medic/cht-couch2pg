const replicator = require('./replicator'),
      log = require('./log'),
      env = require('../../env')(),
      analytics = require('../analytics'),
      {delayLoop} = require('./delay');

let firstRun = false;
let errorCount = 0;
let runTimes = 0;

const replicateAll = async (couchUrl, pgconn) => {
  let allResults = [],
      runErrored = false;
  try {
    allResults = [
      await replicator.replicator(couchUrl, pgconn).importAll(),
      await replicator.replicator(`${couchUrl}-sentinel`, pgconn).importAll()
    ];
  } catch(err) {
    log.error('Couch2PG import failed');
    log.error(err);
    if (err  && err.status === 401){
      process.exit(1);
    }
    runErrored = true;
  }
  return [allResults, runErrored];
};

const run = async (couchUrl, pgconn, timesToRun=undefined) => {
  log.info('Beginning couch2pg and xmlforms run at ' + new Date());
  const [allResults, runErrored] = await replicateAll(couchUrl, pgconn);
  if(allResults) {
    const [medicResults, sentinelResults] = allResults;
    // Run secondary tasks if we reasonably think there might be new data
    // runErrored || errorCount <- something went wrong, but maybe there is still new data
    // firstRun <- this is first run, we don't know what the DB state is in
    // results.deleted.length || results.edited.length <- data has changed
    if (runErrored || errorCount || firstRun ||
        medicResults.deleted.length || medicResults.edited.length ||
        sentinelResults.deleted.length || sentinelResults.edited.length) {
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

  if(runErrored && errorCount++ >= env.couch2pgRetryCount) {
    throw new Error('Too many consecutive errors');
  } else {
    errorCount = 0;
  }

  if(!timesToRun || ++runTimes < timesToRun) {
    await delayLoop(runErrored, env.sleepMs);
    await run(couchUrl, pgconn, timesToRun);
  }
};

module.exports = {
  run: run
};
