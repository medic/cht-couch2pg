FROM node:8

WORKDIR /usr/app

COPY package.json .
COPY package-lock.json .

RUN npm ci
RUN npm i -g grunt-cli

COPY . .
