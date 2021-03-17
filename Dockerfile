ARG node_version
FROM node:$node_version

WORKDIR /usr/app

COPY package.json .
COPY package-lock.json .

RUN npm install node-libcurl@1.3.3

RUN npm ci
RUN npm i -g grunt-cli

COPY . .
