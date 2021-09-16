var log = require('loglevel');

var safeNum = function(v) {
  return v && Number(v);
};

module.exports = function() {
  var level = process.env.COUCH2PG_DEBUG === 'false' ? 'info' : 'debug';
  log.setDefaultLevel(level);

  return {
    debug: process.env.COUCH2PG_DEBUG === 'false' ? false : true,
    v4Mode: process.env.V0_4_MODE || false,
    couchdbUrl: process.env.COUCHDB_URL,
    postgresqlUrl: process.env.POSTGRESQL_URL,
    docLimit: safeNum(process.env.COUCH2PG_DOC_LIMIT),
    changesLimit: safeNum(process.env.COUCH2PG_CHANGES_LIMIT),
    retryCount: safeNum(process.env.COUCH2PG_RETRY_COUNT),
    sleepMins: safeNum(process.env.COUCH2PG_SLEEP_MINS) || 60,
    couchdbUsersMetaDocLimit: safeNum(process.env.COUCH2PG_USERS_META_DOC_LIMIT) || 50,
  };
};
