#!/bin/sh

set -e

git clone https://github.com/keggsmurph21/catonline
cd catonline
git checkout module
git submodule update --recursive --remote
cd src/catext
pip install -r requirements.txt
cd ../..

. scripts/bootstrap.sh
runlocal
