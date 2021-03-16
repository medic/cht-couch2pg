# Base Build
FROM node:10.20.1-alpine AS build-couch2pg
RUN apk --no-cache -q add build-base libgit2-dev bash
RUN ln -s /usr/lib/libcurl.so.4 /usr/lib/libcurl-gnutls.so.4
WORKDIR /app
COPY . .
RUN npm ci

# Test
FROM build-couch2pg AS test-couch2pg
ARG PG_PASS
ARG COUCH_PASS
ARG COUCH_ADMIN
ARG PG_SVC
ARG COUCHDB_SVC
ENV TEST_PG_URL="postgres://postgres:${PG_PASS}@${PG_SVC}:5432"
ENV TEST_COUCH_URL="http://${COUCH_ADMIN}:${COUCH_PASS}@${COUCHDB_SVC}:5984"
WORKDIR /app
RUN npm install -g grunt
RUN grunt test

# Final
FROM build-couch2pg AS medic-couch2pg
WORKDIR /app
RUN rm -rf tests
Entrypoint ["node", "."]