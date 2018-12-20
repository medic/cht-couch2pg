const safe = (opts) => {
  const o = Object.assign({}, opts);
  if(o.couchdbUrl && o.couchdbUrl.split('@').length>0) {
    o.couchdbUrl = o.couchdbUrl.split('@').pop();
  }
  if(o.postgresqlUrl && o.postgresqlUrl.split('@').length>0) {
    o.postgresqlUrl = o.postgresqlUrl.split('@').pop();
  }
  return o;
};

module.exports = safe;
