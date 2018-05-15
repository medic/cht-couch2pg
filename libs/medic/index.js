const analytics = require('../analytics'),
      pgp = require('pg-promise'),
      couch2pg = require('../couch2pg'),
      log = require('./log'),
      runner = require('./runner'),
      legacyRunner = require('./legacy-runner');

const replicate = async (couchUrl, pgUrl, opts={}) => {
  try {
    log.setDefaultLevel(opts.debug ? 'debug' : 'info');

    log.debug(`${couchUrl} => ${pgUrl}`);
    log.debug(opts);

    await couch2pg.migrate(pgUrl);
    const pgconn = pgp({ 'promiseLib': Promise })(pgUrl);
    if (opts.v4Mode) {
      log.info('Adapter is running in 0.4 mode');
      await legacyRunner.run(couchUrl, pgconn, opts);
    } else {
      log.info('Adapter is running in NORMAL mode');
      await analytics.migrate(pgUrl);
      await runner.run(couchUrl, pgconn, opts);
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
    replicateTo: (pgUrl, opts) => replicate(couchUrl, pgUrl, opts)
  };
};
