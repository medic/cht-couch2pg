const legacyRun = async () => {
  log.info('Beginning couch2pg run at ' + new Date());
  try {
    await importer.importAll()
    await delayLoop();
    await legacyRun();
  } catch(err) {
    log.error('Couch2PG import failed');
    log.error(err);
    await delayLoop(true);
  }
};
