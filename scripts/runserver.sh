#!/bin/sh

if [ -z $1 ]; then
  return
elif [ $1 = local ]; then
  APP=local
elif [ $1 = web ]; then
  APP=web
else
  return
fi


# read in config vars
echo "Setting up application" > /dev/stderr
. src/$APP/config.sh

# stop other app instances
stopserver

# make logs directory
echo "Setting logs directory to: $LOG_DIR" > /dev/stderr
if [ ! -d $LOG_DIR ]; then
  mkdir -p $LOG_DIR
  echo "startserver.sh: Created directory for logs at: $LOG_DIR" > /dev/stderr
fi

# get mongo setup
if [ ! -d $DB_PATH ]; then
  mkdir -p $DB_PATH
  echo "startserver.sh: Created directory for db at: $DB_PATH" > /dev/stderr
fi
sudo chmod 0777 $DB_PATH

# start a new mongo process
mongod --dbpath $DB_PATH >> $LOG_DIR/mongo.log &
MONGO_PID=$!
echo "startserver.sh: Launching mongodb with PID: $MONGO_PID" > /dev/stderr

# start the app
nodemon src/$APP/server.js &
APP_PID=$!
echo "startserver.sh: Launching application with PID: $APP_PID" > /dev/stderr
