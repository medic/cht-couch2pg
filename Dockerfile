#base Build
ARG node_version=10
FROM node:$node_version-buster-slim as base_couch2pg_build
# Debian buster is EOL — its repos moved to archive.debian.org (deb.debian.org / security.debian.org now 404).
RUN sed -i -e 's|http://deb.debian.org/debian|http://archive.debian.org/debian|g' \
           -e 's|http://security.debian.org/debian-security|http://archive.debian.org/debian-security|g' \
           -e '/buster-updates/d' /etc/apt/sources.list \
 && echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99no-check-valid-until
RUN apt update
RUN apt dist-upgrade -y
RUN apt -y install postgresql-client curl
WORKDIR /app
COPY . .
RUN npm ci

#Test build
FROM base_couch2pg_build AS test-couch2pg
WORKDIR /app
RUN apt-get install git --assume-yes
RUN git submodule update --init
RUN npm i -g grunt-cli


# Final
FROM base_couch2pg_build AS cht-couch2pg
LABEL Authors="MEDIC SRE TEAM<devops@medic.org>"
WORKDIR /app
RUN rm -rf tests
ENTRYPOINT [ "/app/couch2pg-entrypoint.sh" ]
CMD ["main"]
