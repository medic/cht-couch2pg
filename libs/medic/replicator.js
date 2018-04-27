const urlParser = require('url'),
      PouchDB = require('pouchdb'),
      couch2pg = require('couch2pg'),
      env = require('../../env')();

// Removes credentials from couchdb url
// Converts http://admin:pass@localhost:5984/couch1
// to localhost:5984/couch1 -- seq source
const parseSource = url => {
  const source = urlParser.parse(url);
  return `${source.host}${source.path}`;
};

const replicator = (couchUrl, pgconn) => {
  return couch2pg.importer(
          pgconn,
          new PouchDB(couchUrl),
          env.couch2pgDocLimit,
          env.couch2pgChangesLimit,
          parseSource(couchUrl));
};

module.exports = {
  replicator: replicator
};
