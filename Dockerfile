FROM node:carbon

WORKDIR /usr/app

COPY package.json .
RUN yarn --silent
RUN yarn global add grunt-cli
COPY . .
