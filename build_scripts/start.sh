#!/bin/bash

cp -r /home/ubuntu/node/keys /home/ubuntu/app/
cd /home/ubuntu/app/
sudo docker-compose up -d --build