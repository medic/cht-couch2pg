var format = require('pg-format');

// TODO: put this in a better place
var TABLE = 'couchdb',
    COL = 'doc';

// TODO: inline this, it's only used once
exports.insertIntoColumn = function(data) {
  return format('INSERT INTO %I (%I) VALUES %L;',
    TABLE, COL, data);
};

// TODO: inline this, it's only used once
exports.fetchEntries = function() {
  return format('SELECT %I->\'_id\' AS _id, %I->\'_rev\' AS _rev FROM %I',
    COL, COL, TABLE);
};
