ARG node_version=10
FROM node:$node_version

RUN apt-get update
RUN apt-get -y install postgresql-client curl

WORKDIR /usr/app

COPY package.json .
COPY package-lock.json .

RUN npm ci
RUN npm i -g grunt-cli

COPY . .

CMD ["/bin/sh", "/usr/app/couch2pg-entrypoint.sh", "main"]