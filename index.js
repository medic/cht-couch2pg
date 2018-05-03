#!/usr/bin/env node

const chalk = require('chalk'),
      figlet = require('figlet'),
      CLI = require('clui'),
      Spinner = CLI.Spinner,
      inquirer = require('./inquirer'),
      replicate = require('./libs/replicate');

console.log(
  chalk.yellow(
    figlet.textSync('Medic-Couch2Pg', { horizontalLayout: 'full' })
  )
);

const run = async (args) => {
  const {couchUrl, pgUrl, ...opts} = await inquirer.askDetailsAndOptions(args);
  const status = new Spinner('medic-couch2pg:');
  status.start();
  try {
    await replicate(couchUrl, pgUrl, opts);
  } finally {
    status.stop();
  }
};

var args = process.argv.slice(2);
run(args);
