import os

import config as cfg
import shutil

from env import Env

class User(object):

    def __init__(self):

        cfg.app_logger.debug('bootstrapping new User')

    def logout(self):
        shutil.rmtree(self.path)
        cfg.current_user = None

    def set(self, data, token):

        # grab some data from the response
        self.name = data['name']
        self.data = data

        # but not all of it
        for key in ['password', '__v']:
            self.data.pop(key)

        # grab the token
        self.token = token

        # the root of where we're going to store our data
        self.path = os.path.join(cfg.env.get('USERS_ROOT'), self.name)
        if not(os.path.exists(self.path)):
            cfg.app_logger.debug('creating new user: {}'.format(self.name))
            os.mkdir(self.path)
            os.mkdir(os.path.join(self.path, 'games'))
        else:
            cfg.app_logger.debug('user already exists, overwriting')

        self.write()

        return self

    def write(self):

        cfg.app_logger.info('writing user data for {}'.format(self.name))

        e = Env(os.path.join(self.path, 'data.ct'))
        for key in self.data:
            e.set(key, self.data[key])

        with open(os.path.join(self.path, 'token'), 'w') as f:
            f.write(self.token)

    def read(self, name):

        cfg.app_logger.debug('reading in user data for {}'.format(name))

        self.name = name
        self.path = os.path.join(cfg.env.get('USERS_ROOT'), self.name)
        if not(os.path.exists(os.path.join(self.path, 'token'))):
            return None

        e = Env(os.path.join(self.path, 'data.ct'))
        self.data = e.variables

        with open(os.path.join(self.path, 'token')) as f:
            self.token = f.read()

        return self
