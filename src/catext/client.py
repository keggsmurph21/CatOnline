#!/bin/env python

import socket
import os
import sys

path = './test.sock'

class App:
  def __init__(self, name, path='test.sock'):

    self.name = name
    self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    print('client connecting to {}'.format(path))

    try:
      self.sock.connect(path)
    except socket.error as e:
      print(e)
      sys.exit(1)

  def talk(self, msg):

    msg = msg.encode()

    try:
      self.sock.sendall(msg)
      response = self.sock.recv(1024)
      print('{} ~~ {}'.format(self.name, response))
      return response.decode()

    except socket.edfod as e:
      print(e)
      sys.exit(1)

