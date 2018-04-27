const replicator = require('./replicator'),
      {delayLoop} = require('./delay'),
      log = require('./log');

let legacyRunTimes = 0;

const run = async (couchUrl, pgconn, timesToRun=undefined) => {
  log.info('Beginning couch2pg run at ' + new Date());
  try {
    await replicator(couchUrl, pgconn).importAll();

    if(!timesToRun || ++legacyRunTimes < timesToRun) {
      await delayLoop();
      await run();
    }
  } catch(err) {
    log.error('Couch2PG import failed');
    log.error(err);
    await delayLoop(true);
  }
};

module.exports = {
  run: run
};
