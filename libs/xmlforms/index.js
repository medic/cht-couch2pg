const Postgrator = require('postgrator'),
      pgp = require('pg-promise'),
      Promise = require('rsvp').Promise,
      log = require('loglevel');

const MIGRATION_VERSION = '201711101200';
const MIGRATION_DIR = `${__dirname}/migrations`;
const SCHEMA_TABLE = 'xmlforms_migrations';
const LOG_LEVEL = log.levels.DEBUG;

const migrate = url => {
  const postgrator = new Postgrator({
    migrationDirectory: MIGRATION_DIR,
    schemaTable: SCHEMA_TABLE,
    driver: 'pg',
    logProgress: log.getLevel() <= LOG_LEVEL,
    connectionString: url
  });
  return postgrator.migrate(MIGRATION_VERSION);
}

const update = async (db) => {
  log.info('Refreshing materialised views');
  const results = await db.one('SELECT refresh_matviews()');
  log.debug(results);
  return results;
}

module.exports = {
  migrate: migrate,
  update: update
};
