const Postgrator = require('postgrator');
const log = require('loglevel');

const migrate = postgresUrl => {
  const postgrator = new Postgrator({
    migrationDirectory: `${__dirname}/migrations`,
    schemaTable: 'medic_users_meta_migrations',
    driver: 'pg',
    logProgress: log.getLevel() <= log.levels.DEBUG,
    connectionString: postgresUrl,
  });

  return postgrator.migrate();
};

module.exports = {
  migrate
};
