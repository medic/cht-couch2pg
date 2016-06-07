var INT_PG_HOST = process.env.INT_PG_HOST || 'localhost',
    INT_PG_PORT = process.env.INT_PG_PORT || 5432,
    INT_PG_USER = process.env.INT_PG_USER,
    INT_PG_PASS = process.env.INT_PG_PASS,
    INT_PG_DB   = process.env.INT_PG_DB || 'medic-analytics-test',
    INT_COUCHDB_URL = process.env.INT_COUCHDB_URL || 'http://admin:pass@localhost:5984/medic-analytics-test';

process.env.POSTGRESQL_URL = 'postgres://' +
  (INT_PG_USER ? INT_PG_USER : '') +
  (INT_PG_PASS ? INT_PG_PASS += ':' + INT_PG_PASS : '') +
  (INT_PG_USER ? '@' : '') +
  INT_PG_HOST + ':' + INT_PG_PORT + '/' + INT_PG_DB;
process.env.COUCHDB_URL = INT_COUCHDB_URL;

var _ = require('underscore'),
    RSVP = require('rsvp'),
    common = require('../../tests/common'),
    expect = common.expect,
    Promise = RSVP.Promise,
    pgp = require('pg-promise')({ 'promiseLib': Promise }),
    format = require('pg-format'),
    couch2pg = require('../../libs/couch2pg/index'),
    pouchdb = require('pouchdb');

var DOCS_TO_CREATE = 10;
var DOCS_TO_ADD = 3;
var DOCS_TO_EDIT = 3;
var DOCS_TO_DELETE = 3;

var createPgConnection = function(host, port, user, pass, database) {
  var options = {
    host: host,
    port: port
  };
  if (user) {
    options.user = user;
  }
  if (pass) {
    options.pass = pass;
  }
  if (database) {
    options.database = database;
  }

  return pgp(options);
};

// drop and re-create couchdb
var initialiseCouchDb = function() {
  return pouchdb(INT_COUCHDB_URL).destroy().then(function() {
    return new Promise(function(res) {
      res(pouchdb(INT_COUCHDB_URL));
    });
  });
};

// Drop and re-create postgres db
var initialisePostgresql = function() {
  var pg = createPgConnection(INT_PG_HOST, INT_PG_PORT, INT_PG_USER, INT_PG_PASS);
  return pg.query(format('DROP DATABASE %I', INT_PG_DB))
    .then(function() {}, function() {}) // don't care if it passed or failed
    .then(function() {
      return pg.query(format('CREATE DATABASE %I', INT_PG_DB)).then(function() {
        return new Promise(function(res) {
          res(createPgConnection(INT_PG_HOST, INT_PG_PORT, INT_PG_USER, INT_PG_PASS, INT_PG_DB));
        });
      });
    });
};

var randomData = function() {
  return [
    _.sample(['happy', 'sad', 'angry', 'scared', 'morose', 'pensive', 'quixotic']),
    _.sample(['red', 'blue', 'green', 'orange', 'pink', 'mustard', 'vermillion']),
    _.sample(['cat', 'dog', 'panda', 'tiger', 'ant', 'lemur', 'dugong', 'vontsira'])
    ].join('-');
};

var generateRandomDocument = function() {
  return {
    data: randomData()
  };
};

describe('couch2pg', function() {
  var couchdb, pgdb;

  var createDocs = function(docs) {
    return couchdb.bulkDocs(docs).then(function(results) {
      return _.zip(docs, results).map(function(docAndResult) {
        // TODO replace with destructuring when node supports it
        var doc = docAndResult[0];
        var result = docAndResult[1];

        if (!result.ok) {
          throw ['Document failed to be saved', result];
        }

        doc._id = result.id;
        doc._rev = result.rev;

        return doc;
      });
    });
  };

  var couchDbDocs = function() {
    return couchdb.allDocs({
      include_docs: true
    }).then(function(results) {
      return _.pluck(results.rows, 'doc');
    });
  };

  var itRunsSuccessfully = function() {
    return couch2pg.migrate().then(couch2pg.import);
  };

  var itHasTheSameNumberOfDocs = function() {
    RSVP.all([
      pgdb.one('SELECT COUNT(*) FROM couchdb'),
      couchDbDocs
    ]).then(function(results) {
      var pgCount = parseInt(results[0].count),
          couchCount = results[1].length;

      expect(pgCount).to.equal(couchCount);
    });
  };

  var itHasTheSameDocuments = function() {
    RSVP.all([
      pgdb.query('SELECT * from couchdb'),
      couchDbDocs
    ]).then(function(results) {
      var pgdocs = _.pluck(results[0], 'doc');
      var docs = results[1];

      expect(_.sortBy(pgdocs, '_id')).deep.equals(_.sortBy(docs, '_id'));
    });
  };

  before(function() {
    return initialiseCouchDb()
      .then(function(db) {
        console.log('Initialised couchdb');
        couchdb = db;
        return initialisePostgresql();
      }).then(function(db) {
        console.log('Initialised postgres');
        pgdb = db;
      });
  });

  describe('initial import into postgres', function() {
    before(function() {
      return _.range(DOCS_TO_CREATE).map(generateRandomDocument).createDocs;
    });

    it('runs successfully', itRunsSuccessfully);
    it('has the same number of documents as couch', itHasTheSameNumberOfDocs);
    it('has the same documents as couch', itHasTheSameDocuments);
  });
  describe('subsequent creations, updates and deletions', function() {
    before(function() {
      return couchDbDocs().then(function(docs) {
        var deletedDocs = _.sample(docs, DOCS_TO_DELETE);
        docs = _.difference(docs, deletedDocs);
        deletedDocs.forEach(function(doc) {
          doc._deleted = true;
        });

        var updatedDocs = _.sample(docs, DOCS_TO_EDIT);
        updatedDocs.forEach(function(doc) {
          doc.data = randomData();
        });

        var createdDocs =_.range(DOCS_TO_ADD).map(generateRandomDocument);

        return couchdb.bulkDocs(deletedDocs)
        .then(function() {
          return couchdb.bulkDocs(updatedDocs).then(function(results) {
            results.forEach(function(result) {
              var doc = docs.find(function(d) {
                return d._id === result.id;
              });

              doc._id = result.id;
              doc._rev = result.rev;
            });
          });
        })
        .then(function() {
          return createDocs(createdDocs).then(function(createdDocs) {
            docs = docs.concat(createdDocs);
          });
        });
      });
    });


    it('runs successfully', itRunsSuccessfully);
    it('has the same number of documents as couch', itHasTheSameNumberOfDocs);
    it('has the same documents as couch', itHasTheSameDocuments);
  });
  describe('no change', function() {
    it('runs successfully', itRunsSuccessfully);
    it('still has the same number of documents as couch', itHasTheSameNumberOfDocs);
    it('still has the same documents as couch', itHasTheSameDocuments);
  });
});
