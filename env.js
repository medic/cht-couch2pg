var log = require('loglevel');

var safeNum = function(v) {
  return v && Number(v);
};

module.exports = function() {
  var level = process.env.COUCH2PG_DEBUG === 'false' ? 'info' : 'debug';
  log.setDefaultLevel(level);

  const notFalse = value => value !== 'false';
  return {
    debug: notFalse(process.env.COUCH2PG_DEBUG),
    v4Mode: process.env.V0_4_MODE || false,
    couchdbUrl: process.env.COUCHDB_URL,
    postgresqlUrl: process.env.POSTGRESQL_URL,
    docLimit: safeNum(process.env.COUCH2PG_DOC_LIMIT),
    changesLimit: safeNum(process.env.COUCH2PG_CHANGES_LIMIT),
    retryCount: safeNum(process.env.COUCH2PG_RETRY_COUNT),
    sleepMins: safeNum(process.env.COUCH2PG_SLEEP_MINS) || 60,
    couchdbUsersMetaDocLimit: safeNum(process.env.COUCH2PG_USERS_META_DOC_LIMIT) || 50,
    syncMedicDb: notFalse(process.env.SYNC_DB_MEDIC),
    syncSentinelDb: notFalse(process.env.SYNC_DB_SENTINEL),
    syncUserMetaDb: notFalse(process.env.SYNC_DB_USER_META),
    syncLogsDb: notFalse(process.env.SYNC_DB_LOGS),
    syncUsersDb: process.env.SYNC_DB_USERS === 'true',
  };
};
