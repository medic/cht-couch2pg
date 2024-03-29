setup() {
    load 'test_helper/bats-support/load'
    load 'test_helper/bats-assert/load'
    load 'test_helper/bats-shell-mock/bin/shellmock'
    # get the containing directory of this file
    # use $BATS_TEST_FILENAME instead of ${BASH_SOURCE[0]} or $0,
    # as those will point to the bats executable's location or the preprocessed file respectively
    DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"
    # make executables in  the base directory visible to PATH
    PATH="$DIR/../../:$PATH"
    export WAIT_THRESHOLD=1
    export SLEEP_SECONDS=1

    # set shell mock env
    source="$DIR/test_helper/bats-shell-mock/bin"
    export PATH=$source:$PATH

     #shellcheck
    . shellmock


}

teardown()
{
    if [ -z "$TEST_FUNCTION" ]; then
        shellmock_clean
    fi
    if [ -d "$TEST_TEMP_DIR" ]; then
        rm -rf "$TEST_TEMP_DIR"
    fi
}





@test "entry point script can run" {
    run couch2pg-entrypoint.sh  welcome_message
    assert_output --partial "Starting couch2pg process"
}

@test "test postgres url exported properly" {
    run couch2pg-entrypoint.sh set_postgres_url
    assert_output "Set postgres URL to postgres://cht:cht_password@postgres:5432/cht"
}

@test "when couchdb is not ready we return a wait message" {
    run couch2pg-entrypoint.sh check_if_couchdb_is_ready
    assert_output --partial "Waiting for cht couchdb"
    assert_output --partial "No couchdb end point Found"
}


@test "when couchdb is ready we return a ready message " {
    export COUCHDB_URL=${TEST_COUCH_URL}
    run couch2pg-entrypoint.sh check_if_couchdb_is_ready
    assert_output --partial "couchdb  is ready"
}

@test "when postgres is not ready we return a wait message" {

    shellmock_expect pg_isready --status 1  --type partial
    run couch2pg-entrypoint.sh check_if_postgres_is_ready
    assert_output --partial "Waiting for PostgreSQL..."
    assert_output --partial "No  PostgreSQL DB Found"
}


@test "when postgres is ready we return a ready message" {
    shellmock_expect pg_isready --status 0 --type partial
    run couch2pg-entrypoint.sh check_if_postgres_is_ready
    assert_output --partial "Postgres is ready moving on ..."

}