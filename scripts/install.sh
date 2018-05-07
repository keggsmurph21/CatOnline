#!/bin/sh

set -e

if [ ! -d catonline ]; then
  git clone https://github.com/keggsmurph21/catonline
fi
cd catonline
git checkout module
git submodule update --recursive --remote
cd src/catext
ls
return
pip install -r requirements.txt
cd ../..

. scripts/bootstrap.sh
runlocal
