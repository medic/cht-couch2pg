const Postgrator = require('postgrator'),
      log = require('loglevel');

const migrate = postgresUrl => {
  const postgrator = new Postgrator({
    migrationDirectory: `${__dirname}/migrations`,
    schemaTable: 'xmlforms_migrations',
    driver: 'pg',
    logProgress: log.getLevel() <= log.levels.DEBUG,
    connectionString: postgresUrl
  });

  return postgrator.migrate('201711101200');
};

const update = async (db) => {
  log.info('Refreshing materialised views');

  const result = await db.one('SELECT refresh_matviews()');
  log.debug(result);
  return result;
};

module.exports = {
  migrate: migrate,
  update: update
};
