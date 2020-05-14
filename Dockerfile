# Base Build
FROM node:12.16.3 AS build-couch2pg
WORKDIR /app
COPY . .
RUN npm ci

# Test
FROM build-couch2pg AS test-couch2pg
WORKDIR /app
RUN npm install -g grunt
RUN grunt test

# Final
FROM build-couch2pg AS medic-couch2pg
WORKDIR /app
RUN rm -rf tests
Entrypoint ["node ."]
