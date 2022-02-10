#base Build
ARG node_version=10
FROM node:$node_version as base_couch2pg_build
RUN apt-get update
RUN apt-get -y install postgresql-client curl
WORKDIR /app
COPY . .
RUN npm ci

# Final
FROM base_couch2pg_build AS cht-couch2pg
LABEL Authors="MEDIC SRE TEAM<devops@medic.org>"
WORKDIR /app
ENTRYPOINT [ "/app/couch2pg-entrypoint.sh" ]
CMD ["main"]