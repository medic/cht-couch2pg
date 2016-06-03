// TODO: remove env var usage and pass them into module instantiation
var COUCHDB_URL  = process.env.COUCHDB_URL,
    POSTGRESQL_URL = process.env.POSTGRESQL_URL,
    COUCH2PG_DOC_LIMIT = process.env.COUCH2PG_DOC_LIMIT;

var _ = require('underscore'),
    postgrator = require('postgrator'),
    Promise = require('rsvp').Promise,
    couchdb = require('pouchdb')(COUCHDB_URL),
    db = require('pg-promise')()(POSTGRESQL_URL),
    format = require('pg-format');

var limit = COUCH2PG_DOC_LIMIT || 100;

var deleteDocuments = function(docIdsToDelete) {
  if (docIdsToDelete && docIdsToDelete.length > 0) {
    return db.query(
      format('DELETE FROM couchdb WHERE doc->>\'_id\' in (%L)',
        docIdsToDelete));
  } else {
    return Promise.resolve();
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

var exports = module.exports = {};
exports.import = function() {
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
        return Promise.resolve();
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
};

exports.migrate = function() {
  return new Promise(function (resolve, reject) {
    postgrator.setConfig({
      migrationDirectory: __dirname + '/migrations',
      schemaTable: 'couch2pg_migrations',
      driver: 'pg',
      connectionString: POSTGRESQL_URL
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
