ARG node_version
FROM node:10
WORKDIR /usr/app
COPY package.json .
COPY package-lock.json .
RUN npm ci
RUN npm i -g grunt-cli
COPY . .
ENTRYPOINT ["node", "."]
