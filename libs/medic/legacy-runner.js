const couch2pg = require('../couch2pg'),
      {delayLoop} = require('./delay'),
      log = require('./log');

let legacyRunTimes = 0;

const run = async (couchUrl, pgconn, opts) => {
  log.info('Beginning couch2pg run at ' + new Date());
  try {
    await couch2pg.replicate(couchUrl, pgconn);

    if(!opts.timesToRun || ++legacyRunTimes < opts.timesToRun) {
      await delayLoop(false, opts.sleepMins);
      await run(couchUrl, pgconn, opts);
    }
  } catch(err) {
    log.error('Couch2PG import failed');
    log.error(err);
    await delayLoop(true, opts.sleepMins);
  }
};

module.exports = {
  run: run
};
