#! /bin/bash

# run node tests

grunt test


#run entrypoint script tests

./tests/bash/bats/bin/bats  tests/bash/test.bats