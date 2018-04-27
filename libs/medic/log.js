const log = require('loglevel-message-prefix')(require('loglevel'), {
    prefixes: ['timestamp', 'level']
});

module.exports = log;
