FROM node

WORKDIR /root

ADD server.js /root
ADD package.json /root

RUN npm install

EXPOSE 5000

ENTRYPOINT ["node", "/root/server.js"]
