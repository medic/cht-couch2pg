const inquirer   = require('inquirer');

const INDEFINITELY = 'indefinitely';

module.exports = {

  askDetailsAndOptions: async (args) => {
    const questions = [
      {
        name: 'couchUrl',
        type: 'input',
        message: 'Enter medic\'s couch url:',
        default: args.length >= 1 ? args[0] : 'http://admin:pass@localhost:5984/medic',
        validate: function( value ) {
          return value.length ? true : 'Please enter medic\'s couch url.';
        }
      },
      {
        name: 'pgUrl',
        type: 'input',
        message: 'Enter medic analytics postgres url:',
        default: args.length >= 2 ? args[1] : 'postgres://localhost:5432/medic-analytics',
        validate: function(value) {
          return value.length ? true : 'Please enter medic analytics url';
        }
      },
      {
        name: 'sleepMins',
        type: 'list',
        message: 'Select the number of minutes interval between checking for updates',
        choices: ['1', '5', '20', '60', '120'],
        default: '120'
      },
      {
        name: 'docLimit',
        type: 'list',
        message: 'Select the number of documents to grab concurrently. Increasing this number will cut down on HTTP GETs and may improve performance, decreasing this number will cut down on node memory usage, and may increase stability.',
        choices: ['10', '100', '200', '500', '1000'],
        default: '100'
      },
      {
        name: 'changesLimit',
        type: 'list',
        message: 'Select the number of document ids to grab per change limit request. Increasing this number will cut down on HTTP GETs and may improve performance, decreasing this number will cut down on node memory usage slightly, and may increase stability.',
        choices: ['100', '1000', '10000', '20000', '100000'],
        default: '10000'
      },
      {
        name: 'debug',
        type: 'list',
        message: 'Select whether or not to have verbose logging.',
        choices: ['false', 'true'],
        default: 'true'
      },
      {
        name: 'retryCount',
        type: 'list',
        message: 'Select how many times to internally retry continued unsuccessful runs before exiting. If unset medic-couch2pg will retry indefinitely. If set it will retry N times, and then exit with status code 1',
        choices: ['1', '3', '5', '10', INDEFINITELY],
        default: INDEFINITELY
      },
      {
        name: 'v4Mode',
        type: 'list',
        message: 'Run in v4 mode. Skips anything 2.6+ related.',
        choices: ['false', 'true'],
        default: 'false'
      }
    ];
    const values = await inquirer.prompt(questions);
    ['sleepMins', 'docLimit', 'changesLimit'].forEach(key => {
      values[key] = parseInt(values[key]);
    });
    ['debug', 'v4Mode'].forEach(key => {
      values[key] = values[key] === 'true';
    });
    const retries = values['retryCount'];
    values['retryCount'] = retries === INDEFINITELY ? -1 : parseInt(retries);
    return values;
  }
}
