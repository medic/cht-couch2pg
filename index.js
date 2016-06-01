var couch2pg = require('./libs/couch2pg/index'),
    xmlforms = require('./libs/xmlforms/index'),
    postgrator = require('postgrator'),
    Promise = require('rsvp').Promise;

var sleepMs = process.env.COUCH2PG_SLEEP_MINS * 60 * 1000;
if (isNaN(sleepMs)) {
  console.log('Missing time interval. Defaulting to once per hour.');
  sleepMs = 1 * 60 * 60 * 1000;
}

var potentiallyMigrateDatabase = function() {
  return new Promise(function (resolve, reject) {
    postgrator.setConfig({
      migrationDirectory: __dirname + '/migrations',
      driver: 'pg',
      connectionString: process.env.POSTGRESQL_URL
    });

    postgrator.migrate('001', function(err, migrations) {
      if (err) {
        reject(err);
      } else {
        postgrator.endConnection(function() {
          resolve(migrations);
        });
      }
    });
  });
};

var loop = function () {
  console.log('Starting loop at ' + new Date());
  return potentiallyMigrateDatabase()
    .then(function() {
      console.log('Migration checks complete');
    })
    .then(couch2pg)
    .then(function () {
      console.log('Imported successfully at ' + Date());
    })
    .then(xmlforms)
    .then(function () {
      console.log('XML forms completed at ' + Date());
    })
    .catch(function(err) {
      console.error(err);
    });
};

loop().then(function() {
  console.log('Next run at ' + new Date(new Date().getTime() + sleepMs));
  setInterval(loop, sleepMs);
});
