const analytics = require('../analytics');
const pgp = require('pg-promise');
const couch2pg = require('../couch2pg');
const log = require('./log');
const safe = require('./safe');
const runner = require('./runner');
const medicUsersMeta = require('../medic-users-meta');

const replicate = async (couchUrl, pgUrl, opts={}) => {
  try {
    log.setDefaultLevel(opts.debug ? 'debug' : 'info');

    log.debug(safe(opts));

    await couch2pg.migrate(pgUrl);
    const pgconn = pgp({ 'promiseLib': Promise })(pgUrl);
    log.info('Adapter is running in NORMAL mode');
    await analytics.migrate(pgUrl);
    await medicUsersMeta.migrate(pgUrl);
    await runner.run(couchUrl, pgconn, opts);
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
