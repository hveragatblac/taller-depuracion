FROM node:20.11.1-alpine3.19

RUN mkdir -p /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . /home/node/app/

EXPOSE 9229

CMD ["tail", "-f", "/dev/null"]
