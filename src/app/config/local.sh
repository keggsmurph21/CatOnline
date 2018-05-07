#!/bin/sh


# app setup
export API_SECRET=default # overwrite in .env file
export APP_SECRET=default # overwrite in .env file
export APP_PORT=49160

# logging variables
export LOG_DIR=logs
export DEBUG_LEVEL=DEBUG
export DEBUG_STDERR=1

# db setup
export DB_NAME=catonline-db
export DB_PORT=27017
export DB_URI=mongodb://localhost:$DB_PORT/$DB_NAME
export DB_PATH=data/db
