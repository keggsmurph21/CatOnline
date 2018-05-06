#!/bin/sh

# kill any running mongo processes
if [ ! -z $MONGO_PID ]; then
  if ps -p $MONGO_PID > /dev/null; then
    echo "killing mongo process $MONGO_PID"
    while kill -9 $MONGO_PID 2> /dev/null; do
      sleep 0.01
    done
  fi
fi

# kill any running app process
if [ ! -z $APP_PID ]; then
  if ps -p $APP_PID > /dev/null; then
    echo "killing app process $APP_PID"
    while kill -9 $APP_PID 2> /dev/null; do
      sleep 0.01
    done
  fi
fi
