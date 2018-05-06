#!/bin/sh


# app setup
APP_PORT=49160
APP_UDP_PATH=sockets

# logging variables
LOG_DIR=logs
DEBUG=DEBUG
DEBUG_STDERR=1

# db setup
DB_NAME=catonline-db
DB_PORT=27017
DB_URI=mongodb://mongo:$DB_PORT/$DB_NAME
DB_PATH=data/db
