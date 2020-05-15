# medic-couch2pg ![travis](https://travis-ci.org/medic/medic-couch2pg.svg?branch=master)

Software for creating read-only replicas of CouchDB data inside PostgreSQL v9.4

The focus is specifically on Medic Mobile data currently stored in CouchDB. If you are looking to have a read-only replica of CouchDB data for your application, consider [couch2pg](https://www.npmjs.com/package/couch2pg).

This version is built for medic/medic#3.0.0 and above. For replicating data from earlier versions of Medic, see the 2.0.x branch and associated tags.

## Docker Deployment
### Self-Hosting + Local

Prerequistes:
- CHT-Core setup and installed via Docker
- Postgres 9.4+. Your can use our configuration below to automatically launch a container, or use an existing outside Postgres installation. We recommend the former.
- Identify docker networking used in CHT-Core setup. In your docker-compose.yml for CHT-Core, you should see:

```
networks:
  medic-net:
    name: medic-net

# or underneath each service definition

network: host
```

Export necessary variables:
```
export PG_PASS=password123
export PG_DB=dbname
export COUCH2PG_PW=password321
export PROJECT_URL=gamma.dev.medicmobile.org

# IF your docker network for CHT-Core that was identified above is "medic-net", then:
export PG_SVC=postgres

# IF your docker network for CHT-Core was identified as "host", then:
export PG_SVC=localhost
```

You can either clone this repo, or copy `additional_services.yml` to a local directory.
In order to bring up postgres, run:
```
docker-compose -f additional_services.yml up -d postgres
```
*Note* : If you have an outside Postgres installation, skip the above step.

Then we can bring up medic-couch2pg:
```
docker-compose -f additional_services.yml up -d couch2pg
```

### Medic-Hosted
- Provide link to medic-infrastructure doc

## Local installation steps for development (if applicable)

1. Clone repo
2. Run `npm ci`

## Running tests through docker-compose

Run tests with:
```
export COUCHDB_ADMIN=admin123
export COUCHDB_PASS=password123
export PG_PASS=password321

docker-compose -f docker-compose.ci.yml up -d postgres couchdb
docker-compose -f docker-compose.ci.yml up couch2pg
```

Run tests in interactive watch mode with: `docker-compose -f docker-compose.ci.yml run couch2pg npm run watch`.


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
