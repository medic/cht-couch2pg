#!/usr/bin/env node

const chalk = require('chalk'),
      figlet = require('figlet'),
      CLI = require('clui'),
      Spinner = CLI.Spinner,
      inquirer = require('./inquirer'),
      replicate = require('./libs/replicate'),
      fs = require('fs'),
      env = require('./env')();

const interactiveMode = args => {
  return args && args.length > 0 && args[0] === '-i';
}

const run = async (args) => {
  if(!interactiveMode(args)) {
    await replicate(env.couchdbUrl, env.postgresqlUrl, env);
  } else {
    console.log(
      chalk.yellow(
        figlet.textSync('Medic-Couch2Pg', { horizontalLayout: 'full' })
      )
    );
    const {couchUrl, pgUrl, ...opts} = await inquirer.askAboutConfiguration(args.slice(1));
    const spinner = new Spinner('medic-couch2pg:');
    spinner.start();
    try {
      await replicate(couchUrl, pgUrl, opts);
    } finally {
      spinner.stop();
    }
    process.exit();
  }
};

var args = process.argv.slice(2);
run(args);
