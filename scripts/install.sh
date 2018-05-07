#!/bin/sh

set -e

if [ ! -d catonline ]; then
  git clone -b module --single-branch https://github.com/keggsmurph21/catonline --recurse-submodules
fi
cd catonline
. scripts/bootstrap.sh
cd src/catext
pip install -r requirements.txt
cd ../..

runlocal
