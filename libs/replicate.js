const medic = require('./medic');

const replicateMedicToPg = async (couchUrl, pgUrl) => {
  console.log(`Replicating ${couchUrl} to ${pgUrl}`);
  await medic(couchUrl).replicateTo(pgUrl, 1);
};

var args = process.argv.slice(2);
replicateMedicToPg(args[0], args[1]);
