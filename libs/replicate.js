const medic = require('./medic');

module.exports = async (couchUrl, pgUrl, ...[opts]) => {
  await medic(couchUrl).replicateTo(pgUrl, opts);
};
