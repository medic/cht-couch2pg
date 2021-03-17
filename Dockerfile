ARG node_version
FROM node:10
WORKDIR /usr/app

COPY package.json .
COPY package-lock.json .

RUN npm install node-libcurl@1.3.3 --build-from-source

RUN npm ci
RUN npm i -g grunt-cli

COPY . .
CMD ["node", "index.js"]
