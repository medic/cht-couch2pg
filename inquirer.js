const inquirer   = require('inquirer');

const INDEFINITELY = 'indefinitely';

module.exports = {

  askAboutConfiguration: async (args) => {
    const questions = [
      {
        name: 'couchUrl',
        type: 'input',
        message: 'Enter CHT\'s couch url:',
        default: args.length >= 1 ? args[0] : 'http://admin:pass@localhost:5984/medic',
        validate: function( value ) {
          return value.length ? true : 'Please enter CHT\'s couch url.';
        }
      },
      {
        name: 'pgUrl',
        type: 'input',
        message: 'Enter cht-couch2pg postgres url:',
        default: args.length >= 2 ? args[1] : 'postgres://localhost:5432/medic-analytics',
        validate: function(value) {
          return value.length ? true : 'Please enter cht-couch2pg postgres url';
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
        choices: ['10', '100', '200', '500', '1,000'],
        default: '100'
      },
      {
        name: 'changesLimit',
        type: 'list',
        message: 'Select the number of document ids to grab per change limit request. Increasing this number will cut down on HTTP GETs and may improve performance, decreasing this number will cut down on node memory usage slightly, and may increase stability.',
        choices: ['100', '1,000', '10,000', '20,000', '100,000'],
        default: '10,000'
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
        message: 'Select how many times to internally retry continued unsuccessful runs before exiting. If unset cht-couch2pg will retry indefinitely. If set it will retry N times, and then exit with status code 1',
        choices: ['1', '3', '5', '10', INDEFINITELY],
        default: INDEFINITELY
      },
      {
        name: 'couchdbUsersMetaDocLimit',
        type: 'list',
        message: 'Select the number of documents to grab concurrently from the users-meta database. Increasing this number will cut down on HTTP GETs and may improve performance, decreasing this number will cut down on node memory usage, and may increase stability. These documents are larger so set a limit lower than the docLimit',
        choices: ['10', '50', '100', '200', '500'],
        default: '50'
      }
    ];

    const values = {
      syncMedicDb: true,
      syncSentinelDb: true,
      syncUserMetaDb: true,
      ...await inquirer.prompt(questions),
    };

    ['sleepMins', 'docLimit', 'changesLimit'].forEach(key => {
      values[key] = parseInt(values[key].replace(/,/g, ''));
    });
    ['debug'].forEach(key => {
      values[key] = values[key] === 'true';
    });
    const retries = values['retryCount'];
    values['retryCount'] = retries === INDEFINITELY ? -1 : parseInt(retries);
    return values;
  }
}
