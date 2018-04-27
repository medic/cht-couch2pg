const xmlforms = require('./xmlforms'),
      env = require('../env'),
      pgp = require('pg-promise'),
      couch2pg = require('couch2pg'),
      log = require('./log'),
      runner = require('./runner'),
      legacyRunner = require('./legacy-runner');

const replicate = async (couchUrl, pgUrl, timesToRun) => {
  try {
    await couch2pg.migrator(pgUrl)();
    const pgconn = pgp({ 'promiseLib': Promise })(pgUrl);
    if (env.v04Mode) {
      log.info('Adapter is running in 0.4 mode');
      await legacyRunner.run(couchUrl, pgconn, timesToRun);
    } else {
      log.info('Adapter is running in NORMAL mode');
      await xmlforms.migrate(pgUrl);
      await runner.run(couchUrl, pgconn, timesToRun);
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
