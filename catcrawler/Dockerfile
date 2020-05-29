FROM node

WORKDIR /root

ADD catcrawler.js /root
ADD package.json /root

RUN npm install

ENTRYPOINT ["node", "/root/catcrawler.js"]
