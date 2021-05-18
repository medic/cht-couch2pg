const Postgrator = require('postgrator');
const log = require('loglevel');

const migrate = async (postgresUrl) => {

  const postgratorConfig = {
    schemaTable: 'users_meta_migrations',
    driver: 'pg',
    logProgress: log.getLevel() <= log.levels.DEBUG,
    connectionString: postgresUrl,
  };

  const postgrator = new Postgrator({
    ...postgratorConfig,
    migrationDirectory: `${__dirname}/migrations`,
  });

  let lastMigrationExecuted = '';
  try {
    lastMigrationExecuted = await postgrator.getDatabaseVersion();
  } catch (e) {
    if (e.message !== 'relation "users_meta_migrations" does not exist') {
      throw e;  // Unknown error
    }
    // First time migrations for medic-users-meta are executed, so
    // migrations under ./migrations/deprecated were not executed,
    // therefore no need to execute ./migrations/patch scripts
  }
  if (lastMigrationExecuted === '202102191153') {
    // The first migration that contains bugs was executed earlier,
    // the migrations under ./migrations/patch are executed to drop
    // the views without dropping the tables with the data
    const postgratorPatch = new Postgrator({
      ...postgratorConfig,
      migrationDirectory: `${__dirname}/migrations/patch`,
    });
    await postgratorPatch.migrate();
  }
  // Regardless of ./migrations/patch/* migrations being executed
  // or not, the migrations at ./migrations are executed with
  // the creation of the table to hold the meta data (if doesn't
  // exist already) and the views with the right definitions
  return postgrator.migrate();
};

module.exports = {
  migrate
};
