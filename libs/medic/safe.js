const EXPECTED_URLS = ['couchdbUrl', 'postgresqlUrl'];

const cleanUrl = (url) => {
  const parts = url && url.split('@');
  return parts && parts.length > 0 ? parts.pop() : url;
};

const safe = (opts) => {
  const secureOpts = Object.assign({}, opts);
  EXPECTED_URLS.forEach(url => {
    secureOpts[url] = cleanUrl(secureOpts[url]);
  });
  return secureOpts;
};

module.exports = safe;
