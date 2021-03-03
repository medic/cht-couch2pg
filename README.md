# medic-couch2pg ![travis](https://travis-ci.org/medic/medic-couch2pg.svg?branch=master)

Software for creating read-only replicas of CouchDB data inside PostgreSQL v9.4

The focus is specifically on CHT application data currently stored in CouchDB. If you are looking to have a read-only replica of CouchDB data for your application, consider [couch2pg](https://www.npmjs.com/package/couch2pg).

This version is built for medic/cht-core#3.0.0 and above. For replicating data from earlier versions, see the 2.0.x branch and associated tags.

## Installation Steps (if applicable)

1. Clone repo
2. Run `npm ci`

### Running locally with env variables

```
export POSTGRESQL_URL=postgres://localhost:5432/standarddev3
export COUCHDB_URL=https://admin:pass@localhost:5984/medic
export COUCH2PG_SLEEP_MINS=120
export COUCH2PG_DOC_LIMIT=1000
export COUCH2PG_RETRY_COUNT=5
```

Run it locally with env vars: `npm ci && node .`

### Running locally in interactive mode (no env vars needed)

Run it locally in interactive mode: `npm ci && node . -i`


## Running tests through docker-compose

Run tests with:
```
docker-compose build --build-arg node_version=8 test
docker-compose run test grunt test
```
Run tests in interactive watch mode with: `docker-compose run test npm run watch`.


## Running tests against local couch and postgres databases

Run tests with: `grunt test`.
Run tests in interactive watch mode with: `npm run watch`.

Environment variables required for the integration tests to run correctly:
 * `TEST_PG_URL`: postgres url. ie: `http://admin:pass@localhost:5984`
 * `TEST_COUCH_URL`: couch url. ie: `postgres://localhost:5432`

NB: the integration tests destroy and re-create the given databases each time they are run.


## Required database setup

We support PostgreSQL 9.4 and greater. The user passed in the postgres url needs to have full creation rights on the given database.

## Example usage

You should probably install medic-analytics as a service and leave it to do its thing, as it should be able to run independently without any user input.

### Installing as a service using Upstart (Ubuntu 14.4)

To setup a really simple service with upstart, all you need is sudo rights on the server. You want to do something like this:
 - For now, you should still just clone this repo onto your server, check out the relevant tag, and run `npm install`. In the future this will be better!
 - `sudo` create a `/etc/init/couch2pg-example-client.conf`
 - As we are going to put passwords in this file, you want to `chown o-r /etc/init/couch2pg-example-client.conf` so that only root can read it
 - Edit this file and put something like this in it:

```
description "Service for running Example Client's couch2pg integration"
author "Your name"
script
    export POSTGRESQL_URL="..."
    export COUCHDB_URL="..."
    exec nodejs /path/to/the/repo/index
end script
```
 - The service is then a standard service, e.g. `service couch2pg-example-client start`
 
 ### Installing as a service using Systemd (18.04.3 LTS [Bionic Beaver])
To setup couch2pg using systemd is also pretty simple. You will need to have sudo rights to the server and then follow the steps listed below:
 
 - Install git and clone this repo onto your server, check out the relevant tag `git checkout tag_id`, and run `npm ci`. 
 - Create a systemd unit file for your project `sudo` create `/etc/systemd/system/couch2pg-sample-client.service`
 - As we are going to put passwords in this file, you want to `sudo chmod o-r /etc/systemd/system/couch2pg-sample-client.service` so that only root can read it.
 - Edit this file and configure the couch2pg system unit. It could be something simillar to this;
 ```[Unit]
Description=Service for running ACME couch2pg integration

[Service]
Environment='POSTGRESQL_URL=postgres://couch2pg:secret=@localhost:5432/db'
Environment='COUCHDB_URL=https://username:pass@couchdburl/medic'
Environment='COUCH2PG_SLEEP_MINS=720'
Environment='COUCH2PG_DOC_LIMIT=1000'
Environment='COUCH2PG_RETRY_COUNT=5'
Environment='COUCH2PG_CHANGES_LIMIT=1000'

ExecStart=/usr/bin/npm run medic-couch2pg --prefix /path/to/medic-couch2pg/index.js

ExecStartPost= add monitoring script command to run after service starts.
ExecStopPost= add monitoring script to run if service stops 
# Required on some systems
WorkingDirectory=/path/to/medic-couch2pg/source
Restart=always
# Restart service after 10 seconds if couch2pg service crashes
RestartSec=10
# Output to syslog
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=couch2pg-acme

[Install]
WantedBy=multi-user.target
```

 - Reload systemd settings `systemctl daemon-reload`
 - Start the service `sudo service couch2pg-sample-client start`
 - If all goes well the service should start smoothly.
 - You can check the service logs using `journalctl` like this `journalctl -u couch2pg-sample-client --since today`
 
 

