# Base Build
FROM node:10.20.1 AS build-couch2pg
WORKDIR /app
COPY . .
RUN npm ci

# Test
FROM build-couch2pg AS test-couch2pg
ARG PG_PASS
ARG COUCH_PASS
ARG COUCH_USER
ENV TEST_PG_URL="postgres://postgres:${PG_PASS}@postgres:5432"
ENV TEST_COUCH_URL="http://${COUCH_USER}:${COUCH_PASS}@couchdb:5984"
WORKDIR /app
RUN npm install -g grunt
RUN grunt test

# Final
FROM build-couch2pg AS medic-couch2pg
WORKDIR /app
RUN rm -rf tests
Entrypoint ["node ."]
