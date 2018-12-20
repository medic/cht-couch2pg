const EXPECTED_URLS = ['couchdbUrl', 'postgresqlUrl'];

const cleanUrl = (url) => {
  if(url && url.split('@').length>0) {
    return url.split('@').pop();
  }
  return url;
}

const safe = (opts) => {
  const o = Object.assign({}, opts);
  EXPECTED_URLS.forEach(url => {
    o[url] = cleanUrl(o[url]);
  })
  return o;
};

module.exports = safe;
