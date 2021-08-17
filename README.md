# CHT couch2pg

Software for creating read-only replicas of CouchDB data inside PostgreSQL.

The focus is specifically on CHT application data currently stored in CouchDB. If you are looking to have a read-only replica of CouchDB data for your application, consider [couch2pg](https://www.npmjs.com/package/couch2pg).

This version is built for medic/cht-core#3.0.0 and above. For replicating data from earlier versions, see the 2.0.x branch and associated tags.


## Installation Steps (if applicable)

1. Clone repository
2. Run `npm ci`

### Running locally with environment variables

The supported environment variables are:

| Variable             | Description                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| POSTGRESQL_URL       | PostgreSQL instance URL, format: `postgres://[user]:[password]@localhost:[port]/[database name]`           |
| COUCHDB_URL          | CouchDB instance URL, format: `https://[user]:[password]@localhost:[port]/medic`                           |
| COUCH2PG_SLEEP_MINS  | Number of minutes between synchronization                                                                  |
| COUCH2PG_DOC_LIMIT   | Number of documents cht-couch2pg fetches from CouchDB everytime                                          |
| COUCH2PG_RETRY_COUNT | Number of times cht-couch2pg will retry synchronizing documents from CouchDB after experiencing an error |

Example:
```
export POSTGRESQL_URL=postgres://postgres:postgres@localhost:15432/postgres
export COUCHDB_URL=https://admin:pass@localhost:5984/medic
export COUCH2PG_SLEEP_MINS=120
export COUCH2PG_DOC_LIMIT=1000
export COUCH2PG_RETRY_COUNT=5
```

*NOTE:* Currently, cht-couch2pg only runs in node versions 8 , 10 and 12. Later versions of node have been known to fail.+

To run the contents of this repository locally, first, export the above environment variables and then run:  `npm ci && node .`

### Running locally in interactive mode without environment variables

Run it locally in interactive mode: `npm ci && node . -i`

## Running tests through docker-compose

Run tests with:

```bash
docker-compose build cht-couch2pg
docker-compose run cht-couch2pg grunt test
```

Run tests in interactive watch mode with: `docker-compose run test npm run watch`

Run entrypoint script tests with

```bash
docker-compose run cht-couch2pg ./tests/bash/bats/bin/bats  /app/tests/bash/test.bats
```

## Running  the docker image

You can run the [docker image](https://hub.docker.com/r/medicmobile/cht-couch2pg) available on docker hub.  You will need to provide the required environment variables.

### Required Environment Variables

#### 1. COUCHDB_URL

This sets the CouchDB instance URL, format: `https://[user]:[password]@[instance-name]:[port]/

#### 2.COUCH2PG_SLEEP_MINS

This sets the number of minutes between synchronization runs.

#### 3. COUCH2PG_DOC_LIMIT

This sets the document batch size cht-couch2pg fetches from CouchDB every time it querries CouchDB.

#### 4. COUCH2PG_RETRY_COUNT

This sets the number of times cht-couch2pg will retry synchronizing documents from CouchDB after experiencing an error

#### 5. COUCH2PG_CHANGES_LIMIT

The number of document ids to fetch per change limit request

#### 6. COUCH2PG_USERS_META_DOC_LIMIT

The number of documents to fetch concurrently from the users-meta database

#### 7. POSTGRES_DB

The name of the PostgreSQL instance running PostgreSQL.

#### 8. POSTGRES_USER_NAME

The user name cht-couch2pg will use to access PostgreSQL.

#### 9. POSTGRES_DB_NAME

The name of the PostgreSQL database to sync to.

#### 10. POSTGRES_PASSWORD

The password the cht-couch2pg uses to authenticate to PostgreSQL.

A sample docker-compose snippet is shown below. This image can work with the [cht-postgres](https://hub.docker.com/r/medicmobile/cht-postgres) docker image also available on docker hub.

```yaml

  couch:
        image: couchdb:2.3.1
        environment:
          COUCHDB_USER: cht
          COUCHDB_PASSWORD: cht-password
        networks:
        - cht-net
  cht-couch2pg:
        container_name: cht-couch2pg
        image: medicmobile/cht-couch2pg:test-rc.1
        environment:
           COUCHDB_URL: "http://cht:cht_password@couch:5984"
           COUCH2PG_SLEEP_MINS: '720'
           COUCH2PG_DOC_LIMIT: '1000'
           COUCH2PG_RETRY_COUNT: '5'
           COUCH2PG_CHANGES_LIMIT: '100'
           POSTGRES_DB: cht-postgres
           POSTGRES_USER_NAME: cht_couch2pg
           POSTGRES_DB_NAME: cht
           POSTGRES_PASSWORD: couch2pg_password
        depends_on:
          - cht-postgres

  cht-postgres:
        container_name: cht-postgres
        image: medicmobile/cht-postgres:release-postgres13-rc.1
        environment:
            POSTGRES_DB: cht
            POSTGRES_USER: cht
            POSTGRES_PASSWORD: cht_password
            COUCH2PG_USER: cht_couch2pg
            COUCH2PG_USER_PASSWORD: couch2pg_password
            DB_OWNER_GROUP: cht_analytics
        volumes:
            - cht-postgres-data:/var/lib/postgresql/data
        networks:
          - cht-net

volumes:
  cht-postgres-data:
    name: cht-postgres-data

networks:
  cht-net:
   name: cht-net

```

## Known issues

### Error "Checksum failed for migration ..." when upgrading from 3.2.0 to latest

An SQL migration file was changed in version 3.2.0. This made upgrades from 3.1.x impossible, with the process crashing upon startup after the upgrade. See more [details about the error](https://github.com/medic/cht-couch2pg/issues/78).

This was fixed in version 3.2.1, by reverting the changes made to the migration file.
Fresh installations of 3.2.0 should execute this SQL before upgrading:

```sql
UPDATE xmlforms_migrations
  SET md5 = 'e0535c9fe3faef6e66a31691deebf1a8'
  WHERE version = '201606200952' AND
        md5 = '40187aa5ee95eda0e154ecefd7512cda';
```

See more details about the error in [#78](https://github.com/medic/cht-couch2pg/issues/78).

### Error installing deps `ERR! ... node-pre-gyp install --fallback-to-build`

When installing Node.js dependencies locally or building the docker image, you might get an error like:

```
...
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! node-libcurl@1.3.3 install: `node-pre-gyp install --fallback-to-build`
```

It is probably related to a gcc library that is failing with some versions of Node and npm, try with Node 10 without updating the `npm` version that comes with it.
