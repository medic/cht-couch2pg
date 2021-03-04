const urlParser = require('url');
const PouchDB = require('./db');
const couch2pg = require('couch2pg-njuguna');

// Removes credentials from couchdb url
// Converts http://admin:pass@localhost:5984/couch1
// to localhost:5984/couch1 -- seq source
const parseSource = url => {
  const source = urlParser.parse(url);
  return `${source.host}${source.path}`;
};

const replicate = (couchUrl, pgconn, opts, table) => {
  return couch2pg.importer(
          pgconn,
          new PouchDB(couchUrl),
          opts.docLimit,
          opts.changesLimit,
          parseSource(couchUrl),
          table).importAll();
};

const migrate = (pgUrl) => {
  return couch2pg.migrator(pgUrl)();
};

module.exports = {
  replicate: (couchUrl, pgconn, opts, table = 'couchdb') => replicate(couchUrl, pgconn, opts, table),
  migrate: (pgUrl) => migrate(pgUrl)
};
