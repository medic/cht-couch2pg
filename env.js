var log = require('loglevel');

var safeNum = function(v) {
  return v && Number(v);
};

module.exports = function() {
  if (process.env.COUCH2PG_DEBUG === 'false') {
    log.setDefaultLevel('info');
  } else {
    log.setDefaultLevel('debug');
  }

  return {
    v04Mode: process.env.V0_4_MODE || false,
    couchdbUrl: process.env.COUCHDB_URL,
    postgresqlUrl: process.env.POSTGRESQL_URL,
    couch2pgDocLimit: safeNum(process.env.COUCH2PG_DOC_LIMIT),
    couch2pgChangesLimit: safeNum(process.env.COUCH2PG_CHANGES_LIMIT),
    couch2pgRetryCount: safeNum(process.env.COUCH2PG_RETRY_COUNT),
    sleepMs: (safeNum(process.env.COUCH2PG_SLEEP_MINS) || 60) * 60 * 1000
  };
};
