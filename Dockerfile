#base Build
ARG node_version=10
FROM node:$node_version-buster as base_couch2pg_build
RUN apt update
RUN apt dist-upgrade -y
RUN apt -y install postgresql-client curl
WORKDIR /app
COPY . .
RUN npm ci

#Test build
FROM base_couch2pg_build AS test-couch2pg
WORKDIR /app
RUN git submodule update --init
RUN npm i -g grunt-cli


# Final
FROM base_couch2pg_build AS cht-couch2pg
LABEL Authors="MEDIC SRE TEAM<devops@medic.org>"
WORKDIR /app
RUN rm -rf tests
ENTRYPOINT [ "/app/couch2pg-entrypoint.sh" ]
CMD ["main"]