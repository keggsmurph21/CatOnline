#!/bin/sh

set -e

log() {
  echo ${GREEN}runserver.sh$RESET: $1 > /dev/stderr;
}

if [ -z $1 ]; then
  return
elif [ $1 = local ]; then
  export APP=local
elif [ $1 = web ]; then
  export APP=web
else
  return
fi

# read in config vars
echo "Setting up application" > /dev/stderr
. src/app/config/$APP.sh
if [ -f .env ]; then
  . .env
fi

# stop other app instances
stopserver

# make sockets directory
log "Setting sockets directory to: $CATONLINE_UDP_PATH"
if [ ! -d $CATONLINE_UDP_PATH ]; then
  mkdir -p $CATONLINE_UDP_PATH
  log "Created directory for sockets at: $CATONLINE_UDP_PATH"
fi

# make logs directory
log "Setting logs directory to: $LOG_DIR"
if [ ! -d $LOG_DIR ]; then
  mkdir -p $LOG_DIR
  log "Created directory for logs at: $LOG_DIR"
fi

# get mongo setup
if [ ! -d $DB_PATH ]; then
  mkdir -p $DB_PATH
  log "Created directory for db at: $DB_PATH"
fi
log "Need to set permissions for db"
sudo chmod 0777 $DB_PATH

# start a new mongo process
mongod --dbpath $DB_PATH >> $LOG_DIR/mongo.log &
MONGO_PID=$!
log "Launching mongodb with PID: $MONGO_PID"

# start the app
nodemon src/app/server.js &
APP_PID=$!
log "Launching application with PID: $APP_PID"
