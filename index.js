var log = require('loglevel-message-prefix')(require('loglevel'), {
    prefixes: ['timestamp', 'level']
});

var Promise = require('rsvp').Promise,
    env = require('./env')(),
    xmlformsMigrator = require('./libs/xmlforms/migrator');

var PouchDB = require('pouchdb-core');
PouchDB.plugin(require('pouchdb-adapter-http'));

var couchdb = PouchDB(env.couchdbUrl),
    db = require('pg-promise')({ 'promiseLib': Promise })(env.postgresqlUrl);

var couch2pg = require('couch2pg'),
    migrator = couch2pg.migrator,
    importer = couch2pg.importer(
      db, couchdb,
      env.couch2pgDocLimit,
      env.couch2pgChangesLimit),
    xmlforms = require('./libs/xmlforms/updater')(db);

var firstRun = false;
var errorCount = 0;
var sleepMs = function(errored) {
  if (errored) {
    errorCount++;

    if (errorCount === env.couch2pgRetryCount) {
      throw new Error('Too many consecutive errors');
    }

    var backoffMs = errorCount * 1000 * 60;
    return Math.min(backoffMs, env.sleepMs);
  } else {
    errorCount = 0;
    return env.sleepMs;
  }
};

var migrateCouch2pg = function() {
  return migrator(env.postgresqlUrl)();
};
var migrateXmlforms = function() {
  return xmlformsMigrator(env.postgresqlUrl)();
};

var delayLoop = function(errored) {
  return new Promise(function(resolve) {
    var ms = sleepMs(errored);
    log.info('Run '+(errored ? 'errored' : 'complete') + '. Next run at ' + new Date(new Date().getTime() + ms));
    if (ms === 0) {
      resolve();
    } else {
      setTimeout(resolve, ms);
    }
  });
};

var run = function() {
  log.info('Beginning couch2pg and xmlforms run at ' + new Date());

  var runErrored = false;
  return importer.importAll()
  .catch(function(err) {
    log.error('Couch2PG import failed');
    log.error(err);

    if (err  && err.status === 401){
      process.exit(1);
    }
    runErrored = true;
  })
  .then(function(results) {
    // Run secondary tasks if we reasonably think there might be new data
    // runErrored || errorCount <- something went wrong, but maybe there is still new data
    // firstRun <- this is first run, we don't know what the DB state is in
    // results.deleted.length || results.edited.length <- data has changed
    if (runErrored || errorCount || firstRun || results.deleted.length || results.edited.length) {
      return xmlforms.update();
    }
  })
  .catch(function(err) {
    log.error('XMLForms support failed');
    log.error(err);

    runErrored = true;
  })
  .then(function() {
    if (!runErrored) {
      // We have completed a successful run
      firstRun = false;
    }

    return delayLoop(runErrored);
  })
  .then(run);
};

var legacyRun = function() {
  log.info('Beginning couch2pg run at ' + new Date());

  return importer.importAll()
  .then(
    function() {
      return delayLoop();
    },
    function(err) {
      log.error('Couch2PG import failed');
      log.error(err);
      return delayLoop(true);
    })
  .then(legacyRun);
};

var doRun = function() {
  if (env.v04Mode) {
    log.info('Adapter is running in 0.4 mode');

    return migrateCouch2pg()
    .then(legacyRun);
  } else {
    log.info('Adapter is running in NORMAL mode');

    return migrateCouch2pg()
    .then(migrateXmlforms)
    .then(run);
  }
};

doRun().catch(function(err) {
  log.error('An unrecoverable error occurred');
  log.error(err);
  log.error('exiting');
  process.exit(1);
});
