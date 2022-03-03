#!/bin/bash

set -e
WAIT_THRESHOLD="${WAIT_THRESHOLD:-20}"
SLEEP_SECONDS="${SLEEP_SECONDS:-5}"

welcome_message(){
  echo "Starting couch2pg process">&2
}

set_postgres_url(){
  export POSTGRESQL_URL=postgres://$POSTGRES_USER_NAME:$POSTGRES_PASSWORD@$POSTGRES_SERVER:5432/$POSTGRES_DB_NAME
  echo "Set postgres URL to $POSTGRESQL_URL" >&2
}

check_if_postgres_is_ready(){
  #waiting for postgres
  wait_count=0
  echo "export POSTGRESQL_URL=postgres://$POSTGRES_USER_NAME:$POSTGRES_PASSWORD@POSTGRES_SERVER:5432/$POSTGRES_DB_NAME"
  echo "pg_isready -q  -h $POSTGRES_SERVER -U $POSTGRES_USER_NAME --d $POSTGRES_DB_NAME"
  until  pg_isready -q  -h $POSTGRES_SERVER -U $POSTGRES_USER_NAME --d $POSTGRES_DB_NAME
  do
    echo "Waiting for PostgreSQL..." >&2
    wait_count=$((wait_count +1))
    if [[ "$wait_count" -gt $WAIT_THRESHOLD ]]; then
      echo "No  PostgreSQL DB Found" >&2
      exit 1
    fi
    sleep $SLEEP_SECONDS
  done
echo "Postgres is ready moving on ...">&2
}


check_if_couchdb_is_ready(){
  # check if couchdb is up
  wait_count=0
  http_code=$(curl -k --silent --show-error --head "$COUCHDB_URL" --write-out '%{http_code}' | tail -n1)
  echo "START Checking for cht couchdb at ${COUCHDB_URL}" >&2
  until [ "$http_code" = "200" ]
  do
    echo "Waiting for cht couchdb" >&2
    wait_count=$((wait_count +1))
    if [[ "$wait_count" -gt $WAIT_THRESHOLD ]]; then
      echo "No couchdb end point Found" >&2
      exit 1
    fi
    sleep $SLEEP_SECONDS
  done
  echo "couchdb  is ready">&2

}

launch_couchdb(){
  node index.js
}


main (){

welcome_message
set_postgres_url
check_if_couchdb_is_ready
check_if_postgres_is_ready
echo "Launching couchdb">&2
launch_couchdb
}


"$@"