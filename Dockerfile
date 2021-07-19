#base Build
ARG node_version=10
FROM node:$node_version as base_couch2pg_build
RUN apt-get update
RUN apt-get -y install postgresql-client curl
WORKDIR /app
COPY . .
RUN npm ci

#Test build
FROM base_couch2pg_build AS test-couch2pg
ARG PG_PASS
ARG COUCH_PASS
ARG COUCH_ADMIN
ARG PG_SVC
ARG COUCHDB_SVC
ENV TEST_PG_URL="postgres://postgres:${PG_PASS}@${PG_SVC}:5432"
ENV TEST_COUCH_URL="http://${COUCH_ADMIN}:${COUCH_PASS}@${COUCHDB_SVC}:5984"
ENV COUCHDB_USER=${COUCH_ADMIN}
ENV COUCHDB_PASSWORD=${COUCH_PASS}
ENV COUCHDB_HOST=${COUCHDB_SVC}
WORKDIR /app
RUN git submodule update --init
RUN npm i -g grunt-cli
RUN echo "Run NPM tests"
RUN grunt test
RUN echo "RUN entry point script tests"
RUN ./tests/bash/bats/bin/bats  /app/tests/bash/test.bats



# Final
FROM base_couch2pg_build AS medic-couch2pg
WORKDIR /app
RUN rm -rf tests
ENTRYPOINT [ "/app/couch2pg-entrypoint.sh" ]
CMD ["main"]