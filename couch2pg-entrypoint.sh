#!/bin/bash

set -e


#waiting for postgres
until  pg_isready -q  -h $POSTGRES_DB -U $POSTGRES_USER_NAME -d $POSTGRES_DB_NAME
do
  echo "Waiting for PostgreSQL..." >&2
  sleep 5
done

echo "Postgres is ready moving on ...">&2

# check if medic api is up
until curl -s --head  --request GET $COUCHDB_URL $| grep "200 OK" > /dev/null
do
  echo "Waiting for COUCHDB" >&2
  sleep 5
done

echo "COUCHDB  is ready, launching couch2pg">&2

node .