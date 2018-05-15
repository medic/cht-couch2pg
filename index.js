#!/usr/bin/env node

const chalk = require('chalk'),
      figlet = require('figlet'),
      CLI = require('clui'),
      Spinner = CLI.Spinner,
      inquirer = require('./inquirer'),
      replicate = require('./libs/replicate'),
      forever = require('forever-monitor'),
      fs = require('fs');

console.log(
  chalk.yellow(
    figlet.textSync('Medic-Couch2Pg', { horizontalLayout: 'full' })
  )
);

const runInBackground = (couchUrl, pgUrl, opts) => {
  const replica = new forever.Monitor('./libs/replicate_cli.js', {
    max: 5,
    silent: true,
    args: [couchUrl, pgUrl, JSON.stringify(opts)]
  });

  replica.on('exit', function () {
    console.log('replication has exited after 5 restarts');
  });

  const logs = fs.createWriteStream('./replication.log');
  process.stdout.write = process.stderr.write = logs.write.bind(logs);

  console.log = d => { logs.write(d + '\n'); };

  replica.on('restart', savePid);
  replica.on('start', savePid);
  function savePid() { console.log(replica.childData.pid); }

  replica.start();
};

const run = async (args) => {
  const {couchUrl, pgUrl, ...opts} = await inquirer.askAboutConfiguration(args);
  if(opts.backgroundMode) {
    runInBackground(couchUrl, pgUrl, opts);
  } else {
    const spinner = new Spinner('medic-couch2pg:');
    spinner.start();
    try {
      await replicate(couchUrl, pgUrl, opts);
    } finally {
      spinner.stop();
    }
  }
  process.exit();
};

var args = process.argv.slice(2);
run(args);
