const log = require('./log');

let errorCount = 0;

const delayLoop = (errored, sleepMins) => {
  return new Promise(resolve => {
    const ms = sleepTime(errored, sleepMins);
    const nextTime = new Date(new Date().getTime() + ms);
    const status = errored ? 'errored' : 'completed';
    log.info(`Run ${status}. Next run at ${nextTime}`);
    ms === 0 ? resolve() : setTimeout(resolve, ms);
  });
};

const sleepTime = (errored, sleepMins) => {
  const ms = sleepMins * 60 * 1000;
  if (errored) {
    var backoffMs = ++errorCount * 1000 * 60;
    return Math.min(backoffMs, ms);
  }
  errorCount = 0;
  return ms;
};

module.exports = {
  delayLoop: delayLoop
};
