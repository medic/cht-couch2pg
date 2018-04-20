const env = require('./env')(),
      medic = require('./libs/medic');

const replicateMedicToPg = async (couchUrl, pgUrl) => {
  console.log(`Replicating ${couchUrl} to ${pgUrl}`);
  await medic(couchUrl).replicateTo(pgUrl, 1);
}

replicateMedicToPg(env.couchdbUrl, env.postgresqlUrl)
