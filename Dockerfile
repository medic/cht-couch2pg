FROM node:carbon

WORKDIR /usr/app

COPY package.json .
RUN yarn --silent

COPY . .
