var _ = require('underscore'),
    xmlforms = require('./libs/xmlforms/index'),
    postgrator = require('postgrator'),
    Promise = require('rsvp').Promise;

var sleepMs = process.env.COUCH2PG_SLEEP_MINS * 60 * 1000;
if (isNaN(sleepMs)) {
  console.log('Missing time interval. Defaulting to once per hour.');
  sleepMs = 1 * 60 * 60 * 1000;
}

var migrateDatabase = function() {
  return new Promise(function (resolve, reject) {
    postgrator.setConfig({
      migrationDirectory: __dirname + '/migrations',
      driver: 'pg',
      connectionString: process.env.POSTGRESQL_URL
    });

    postgrator.migrate('002', function(err, migrations) {
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

var couchdb = require('pouchdb')(process.env.COUCHDB_URL),
    db = require('pg-promise')()(process.env.POSTGRESQL_URL),
    format = require('pg-format');

var limit = process.env.COUCH2PG_DOC_LIMIT || 100;

// TODO: is there a better idiom for an empty promise?
var emptyPromise = function() {
    return new Promise(function(res) { res(); });
};

var deleteDocuments = function(docIdsToDelete) {
  if (docIdsToDelete && docIdsToDelete.length > 0) {
    return db.query(
      format('DELETE FROM couchdb WHERE doc->>\'_id\' in (%L)',
        docIdsToDelete));
  } else {
    return emptyPromise();
  }
};

var storeSeq = function(seq) {
  return db.query(format('UPDATE couchdb_progress SET seq = %L', seq));
};

/*
NB: loadAndStore doesn't try to only load and store documents that have changed
from postgres' perspective, because we presume if something appears in the
changes feed it needs updating.

If somehow this changes we can make this code more complicated.
*/
var loadAndStoreDocs = function(docsToDownload) {
  if (docsToDownload.length > 0) {
    var changeSet = docsToDownload.splice(0, limit);
    var maxSeq = _.max(_.pluck(changeSet, 'seq'));

    return couchdb.allDocs({
      include_docs: true,
      keys: _.pluck(changeSet, 'id')
    }).then(function(couchDbResult) {
      console.log('Pulled ' + couchDbResult.rows.length + ' results from couchdb');

      console.log('Clearing any existing documents from postgresql');

      return deleteDocuments(_.pluck(couchDbResult.rows, 'id'))
        .then(function() {
          return couchDbResult;
        });
    }).then(function(couchDbResult) {
      console.log('Inserting ' + couchDbResult.rows.length + ' results into couchdb');

      return db.query(format(
        'INSERT INTO couchdb (doc) VALUES %L',
        couchDbResult.rows.map(function(row) {
          return [JSON.stringify(row.doc)];
        })));
    }).then(function() {
      return storeSeq(maxSeq);
    }).then(function() {
      console.log('Marked seq at ' + maxSeq);

      return loadAndStoreDocs(docsToDownload);
    });
  }
};

var couch2pgFn = function() {
  return db.one('SELECT seq FROM couchdb_progress')
    .then(function(seqResult) {
      console.log('Downloading CouchDB changes feed from ' + seqResult.seq);
      return couchdb.changes({
        since: seqResult.seq
      });
    })
    .then(function(changes) {
      console.log('There are ' + changes.results.length + ' changes to process');

      if (changes.results.length === 0) {
        return emptyPromise();
      }

      // TODO when node supports destructuring use it:
       // var [docsToDelete, docsToDownload] = _.partition... etc
      var deletesAndModifications = _.partition(changes.results, function(result) {
        return result.deleted;
      });
      var docsToDelete = deletesAndModifications[0],
          docsToDownload = deletesAndModifications[1];

      console.log('There are ' +
        docsToDelete.length + ' deletions and ' +
        docsToDownload.length + ' new / changed documents');

      return deleteDocuments(_.pluck(docsToDelete, 'id'))
        .then(function() {
          return loadAndStoreDocs(docsToDownload);
        })
        .then(function() {
          console.log('Marked final seq of ' + changes.last_seq);
          return storeSeq(changes.last_seq);
        });
    });
}


var loop = function () {
  console.log('Starting loop at ' + new Date());
  return migrateDatabase()
    .then(function() {
      console.log('Migration checks complete');
    })
    .then(couch2pgFn)
    .then(function () {
      console.log('Imported successfully at ' + Date());
    })
    .then(xmlforms)
    .then(function () {
      console.log('XML forms completed at ' + Date());
    })
    .catch(function(err) {
      console.error('Something went wrong', err);
    });
};

loop().then(function() {
  console.log('Next run at ' + new Date(new Date().getTime() + sleepMs));
  setInterval(loop, sleepMs);
});
