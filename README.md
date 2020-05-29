Lab guide
=========

Let's build an enterprise grade web scale containerized infrastructure for
retrieving depictions of felines of one of the internet's premier link sharing
sites. I.e. let's download cat pictures from reddit.

We'll start by familiarizing ourselves with docker. To do so, we'll launch a
postgresql database in a docker container.

```
topofmind:~$ docker run --name catpicdb -e 'POSTGRES_PASSWORD=catpics' -d postgres

Unable to find image 'postgres:latest' locally
latest: Pulling from library/postgres
afb6ec6fdc1c: Pull complete
51be5f829bfb: Pull complete
e707c08f571a: Pull complete
98ddd8bce9b5: Pull complete
5f16647362a3: Pull complete
5d56cdf9ab3b: Pull complete
2207a50ca41d: Pull complete
a51d14a628f3: Pull complete
24dcb11335d0: Pull complete
54cc759cb0bb: Pull complete
debc11d66570: Pull complete
3ffd0589b5fc: Pull complete
490b7ee49751: Pull complete
3511c6be34a0: Pull complete
Digest: sha256:ec7cfff29672a2f676c11cc53ae7dafe63a57ccefc2b06ea423493227da29b9c
Status: Downloaded newer image for postgres:latest
79bbc99b553747aeaa3bc5de27a9546d66000f5cc3ac6f4004aec54c78969d67
```

This results in an image being downloaded and then the container is started.
The image is downloaded from Dockerhub, where each public image has a page. In
this case, it's here: https://hub.docker.com/_/postgres

In the above command we give the container a name using the `--name` argument,
and specify an environment variable using `-e` which is specific to this image.
The `-d` flag is used to launch in the background.

We can see that it is, in fact, running using the `ps`  command:

```
topofmind:~$ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS               NAMES
8cb73e25e0be        postgres            "docker-entrypoint.s…"   6 seconds ago       Up 6 seconds        5432/tcp            catpicdb
```

We can also use the `logs` command on this container, to see that the server
initialized correctly:

```
docker logs catpicdb
```

Moreover, we're able to run commands within the container. For instance, we
can run the psql command line utility:

```
topofmind@ip-172-31-20-132:~$ docker exec -ti catpicdb psql -U postgres
psql (12.3 (Debian 12.3-1.pgdg100+1))
Type "help" for help.

postgres=# select version();
                                                     version                                     
                 
-------------------------------------------------------------------------------------------------
-----------------
 PostgreSQL 12.3 (Debian 12.3-1.pgdg100+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 8.3.0-
6) 8.3.0, 64-bit
(1 row)

postgres=# 
```

(The `-ti` parameter is required when the command is interactive.)

If we want, we can stop the container. When we stop a container, it remains in
docker and can be restarted:

```
docker stop catpicdb
# -a is used to show stopped container
docker ps -a
docker start catpicdb
```

Having familiarized ourselves with the basics, let's get to work on the cat
pictures. We'll need to make a few tweaks, so we'll stop the database and
relaunch it with different options:

```
docker stop catpicdb
docker rm catpicdb
```

Now we can start it again:

```
docker run --name catpicdb \
    -e POSTGRES_USER=catpics \
    -e POSTGRES_PASSWORD=catpics \
    -v $( pwd )/db:/docker-entrypoint-initdb.d \
    -d \
    postgres
```

In addition to passing another environment variable, we're also using the `-v`
flag. This instructs docker to mount a volume from the host file system. The
`db` folder contains our database scheme, and the `postgres` image
documentation tells us that it will execute all sql scripts in the
`/docker-entrypoint-initdb.d` folder on startup. Through the `-v` flag, we are
able to "insert" our folder into the container so it can load the scheme.

We can now attempt to use this with our downloader. To do so, we need to know
the IP address of the container. We can find it using `inspect`:

```
docker inspect catpicdb
```

The output of this command is a long snippet of json, but we care about this
line:

```
                    "IPAddress": "172.17.0.2",
```

We can now attempt to use the catcrawler with this server:


```
cd catcrawler
npm install # install node dependencies
vi catcrawler.js # edit the host line
node catcrawler.js
```

So that works, but we want to run this program within a container too, and we
don't want to bother with manually configuring IP addresses. Luckily, docker
can solve this for us if we create a new **network**. We also need to relaunch
our database within this new network:

```
docker network create catnet

docker stop catpicdb
docker rm catpicdb
docker run --name catpicdb \
    -e POSTGRES_USER=catpics \
    -e POSTGRES_PASSWORD=catpics \
    -v $( pwd )/db:/docker-entrypoint-initdb.d \
    --network catnet \
    -d \
    postgres
```

Now we can "dockerize" our catcrawler. In the catcrawler folder, create a file
called `Dockerfile` and write the following:

```
FROM node

WORKDIR /root

ADD catcrawler.js /root
ADD package.json /root

RUN npm install

ENTRYPOINT ["node", "/root/catcrawler.js"]
```

Now we can use the `build` command to build an image from our Dockerfile:

```
cd catcrawler
docker build --tag catcrawler .
```

We can use the `image` command to list our images:

```
topofmind:~/dockerdemo/catcrawler$ docker image ls
REPOSITORY              TAG                 IMAGE ID            CREATED             SIZE
catcrawler              latest              b7c9047eba52        39 seconds ago      943MB
node                    latest              91a3cf793116        8 days ago          942MB
postgres                latest              adf2b126dda8        12 days ago         313MB
postgres                11.1                5a02f920193b        15 months ago       312MB
```

Now we're ready to launch the catcrawler:

```
docker run \
    --network catnet \
    --name catcrawler \
    -d \
    catcrawler
```

To verify that all is right, let's check the logs:

```
topofmind:~/dockerdemo/catcrawler$ docker logs -f catcrawler
Downloading fresh catpictures
Downloading https://i.redd.it/wj8uudzs7i151.jpg
Downloading https://i.redd.it/j4328vclbl151.jpg
Downloading https://i.redd.it/eiq87yuf5i151.jpg
Downloading https://i.redd.it/9ezu73bhei151.jpg
Downloading https://i.redd.it/jq219am49j151.jpg
Downloading https://i.redd.it/nm6jq0m8jk151.jpg
Downloading https://i.redd.it/2272m2l5xd151.jpg
Downloading https://i.redd.it/wrysvsk7ph151.jpg
Downloading https://i.redd.it/o8i4pq7w7k151.jpg
Downloading https://i.redd.it/z5mejhtryl151.jpg
Downloading https://i.redd.it/wgfoabsc1l151.jpg
Downloading https://i.redd.it/vvnkpg11xk151.jpg
Downloading https://i.redd.it/hbt9xw3tzj151.jpg
Downloading https://i.redd.it/36j0ctg82k151.jpg
Downloading https://i.redd.it/roj51lq5dj151.jpg
Downloading https://i.redd.it/slaoidxx8b151.jpg
Downloading https://i.redd.it/5qj7hb6iui151.jpg
Downloading https://i.redd.it/5otwbn4g1k151.jpg
Downloading https://i.redd.it/mqx6kqe80j151.jpg
Downloading https://i.redd.it/ddqt2n6ezi151.jpg
Downloading https://i.redd.it/u2uaxbu18e151.jpg
Downloading https://i.redd.it/qz2bgpb2sc151.jpg
Downloading https://i.redd.it/1x5c6teoeb151.jpg
Done, waiting...
```

We can also use psql to check the database again:

```
topofmind@ip-172-31-20-132:~/dockerdemo/catcrawler$ docker exec -ti catpicdb psql -U catpics
psql (12.3 (Debian 12.3-1.pgdg100+1))
Type "help" for help.

catpics=# select count(*) from catpicture;
 count
-------
    23
(1 row)
```

Cat pictures are no good if we can't view them, though, so for that we have our
`catviewer`. Our Dockerfile for that looks as follows:

```
FROM node

WORKDIR /root

ADD server.js /root
ADD package.json /root

RUN npm install

EXPOSE 5000

ENTRYPOINT ["node", "/root/server.js"]
```

The main difference from our previous Dockerfile is the `EXPOSE` command, which
declares which network ports to publicize.

We can build this image like this:

```
cd catviewer
docker build --tag catviewer .
```

And run it much like we did with catcrawler:

```
docker run \
    --network catnet \
    --name catviewer \
    -p 5000 \
    -d \
    catviewer
```

In addition, we're using the `-p` option to specify that we want to publicize
the port 5000 to the host. Docker will assign a public port to us, which we
can find using `ps`:

```
topofmind:~/dockerdemo/catviewer$ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                     NAMES
b9dd9d2a76fd        catviewer           "node /root/server.js"   2 seconds ago       Up 1 second         0.0.0.0:32768->5000/tcp   catviewer
36455ecd3a4a        catcrawler          "node /root/catcrawl…"   4 minutes ago       Up 4 minutes                                  catcrawler
88f3bdc6cb7a        postgres            "docker-entrypoint.s…"   7 minutes ago       Up 7 minutes        5432/tcp                  catpicdb
```

The key part is this fragment `0.0.0.0:32768->5000/tcp` which tells us that we
can visit the catviewer on 32768.

Orchestration
=============

There is, of course, quite a bit of manual labour involved in the above. To
eliminate tedious work, `docker-compose` can be used. Create a new file
`docker-compose.yml`:

```
version: '2.2'
services:
    catpicdb:
        image: 'postgres:11.1'
        environment:
            - POSTGRES_USER=catpics
            - POSTGRES_PASSWORD=catpics
        volumes:
            - ./db:/docker-entrypoint-initdb.d
            - pgdata:/var/lib/postgresql/data
    catcrawler:
        build: catcrawler
        depends_on:
            - catpicdb
    catviewer:
        build: catviewer
        depends_on:
            - catpicdb
        ports:
            - 5000:5000
volumes:
    pgdata:
```

Then run:

```
docker-compose up
docker-compose logs -f
```
