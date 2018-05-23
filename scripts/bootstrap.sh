#!/bin/bash

# colors
GREEN="\033[1;32m"
RED="\033[1;31m"
RESET="\033[0m"

alias echo="echo -e"

alias runlocal=". scripts/runserver.sh local"
alias runweb=". scripts/runserver.sh web"
alias stopserver=". scripts/stopserver.sh"
alias catext="python src/catext/app.py"

export CATONLINE_UDP_PATH=sockets
export CATONLINE_UDP_SOCKET=local.sock
export CATONLINE_PATH=$(pwd)

# python virtual environment setup
if hash virtualenv 2>/dev/null; then

  VENV="catenv"

  if [ ! -d $VENV ]; then
    virtualenv --no-site-packages $VENV
  fi
  . ./$VENV/bin/activate

  # virtual environment use instructions
  echo ""
  echo "NOTE: Python virtual environment activated ($GREEN$VENV$RESET);"
  echo "  to deactivate, type ${GREEN}$ deactivate${RESET}."
  echo ""

fi

# install required python packages
# without "Requirement already satisfied warnings"
pip install -r requirements.txt 1> >(grep -v 'Requirement already satisfied' 1>&2)

# basic ENV file
ENV=.env.co
if [ ! -f $ENV ]; then
  echo "" > /dev/null # placeholder
fi

# more instructions
echo "available commands:"
echo "  - run local server:  ${GREEN}runlocal$RESET"
echo "  - run web server:    ${GREEN}runweb$RESET"
echo "  - stop server:       ${RED}stopserver$RESET"
echo "  - use catonline cli: ${GREEN}catext$RESET (note: local server must be running)"
echo ""
