const replicate = require('./replicate');

const run = async(couchUrl, pgUrl, opts) => {
  await replicate(couchUrl, pgUrl, opts);
};

var [couchUrl, pgUrl, opts] = process.argv.slice(2);
run(couchUrl, pgUrl, JSON.parse(opts));
