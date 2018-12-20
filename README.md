# medic-couch2pg ![travis](https://travis-ci.org/medic/medic-couch2pg.svg?branch=master)

Software for creating read-only replicas of CouchDB data inside PostgreSQL v9.4

The focus is on Medic Mobile data currently stored in CouchDB, but applications
might extend beyond that.

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

Run tests with: `docker-compose run test grunt test`.
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
