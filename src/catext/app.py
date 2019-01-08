import argparse
import json
import os
import sys

from curses import wrapper

import config as cfg

from api  import *
from cli  import *
from env  import Env
from log  import Logger
from user import User

__all__ = ['CaTexT', 'CaTexTError', 'play']

class CaTexT(object):
    def __init__(self, args={}):

        # root environment variable manager
        env_path = cfg.get_path('.env.ct')
        cfg.env = Env(env_path)
        cfg.env.set('CURRENT_USER','')
        cfg.env.set('PROJECT_ROOT', cfg.root)
        cfg.app = self

        # evaluate passed arguments (dictionary)
        self.args = args
        self.parse_args()

        # make some loggers
        logs_path = cfg.get_path('logs')
        if not(os.path.exists(logs_path)):
            os.mkdir(logs_path)
        cfg.root_logger = Logger('ROOT')
        cfg.app_logger = Logger('APP')
        cfg.app_logger.debug('initializing CaTexT ...')

        # make sure we have a path to hold our user data
        users_path = cfg.get_path('.users')
        cfg.env.set('USERS_ROOT', users_path)
        if not(os.path.exists(users_path)):
            cfg.app_logger.debug('creating ".users" directory')
            os.mkdir(users_path)

        # set up our "GUI" which is really just a (curses) CLI
        cli = cfg.env.get('CLI_TYPE','curses')
        cfg.cli_logger = Logger('CLI')
        cfg.cli = choose_cli(cli)()

        # set up the interface w/ our REST API
        try:
            api = cfg.env.get('API_TYPE','http')
            cfg.api_logger = Logger('API')
            cfg.api = choose_api(api)()
        except APIError as e:
            cfg.app_logger.critical(e)
            cfg.cli.set_status('ERROR: {}'.format(e))
            cfg.cli.wait()
            raise CaTexTError(e)

        # get our new-game-form parameters
        with open(cfg.get_path('config','new_game_form.json')) as f:
            cfg.new_game_form = json.load(f)

        cfg.app_logger.debug('... CaTexT initialized')

        # initialize current_user to None (need it for self.loop())
        self.login()

    def lobby(self, payload=None):
        # go to the lobby
        if cfg.current_user is None:
            return self.login()

        try:
            cfg.app_logger.info('entering lobby')
            data = cfg.api.lobby(cfg.current_user.token, payload)
            cfg.cli.change_mode('lobby', data)
        except APIError as e:
            raise e

    def login(self):
        cfg.current_user = None
        cfg.cli.change_mode('home')

    def logout(self):
        cfg.current_user.logout()
        cfg.env.set('CURRENT_USER','')
        cfg.cli.change_mode('home')

    def get_user(self, name):
        if name == None:
            return None
        return User().read(name)

    def save_user(self, username, password):
        try:
            user_data, token = self.authenticate(username, password)
            return User().set(user_data, token)
        except APIError as e:
            cfg.app_logger.error(e)
            if isinstance(e, APIInvalidDataError):
                cfg.cli.set_status(str(e))
            elif isinstance(e, APIConnectionError):
                cfg.cli.set_status('ERROR: only local logins are available')
                cfg.cli.wait()

    def authenticate(self, username, password):
        ''' either use an authentication token or get a new one '''
        response = cfg.api.login(username, password)
        return response['user'], response['token']

    def parse_args(self):
        pass#print('args',self.args)

    def quit(self):
        cfg.cli.set_status('Goodbye!')
        cfg.app_logger.info('CaTexT quitting')
        cfg.cli.quit()
        cfg.root_logger.info('goodbye')
        sys.exit(0)


class CaTexTError(Exception): pass


def play(args={}):

    app = CaTexT(args)


if __name__ == '__main__':

    parser = argparse.ArgumentParser()
    parser.add_argument('-a','--api', help='either `http` or `socketio`')
    parser.add_argument('-c','--cli', help='either `basic` or `curses`')
    parser.add_argument('--debug')
    parser.add_argument('--quiet')
    parser.add_argument('--set-default-user', help='set this user as the default')
    parser.add_argument('-u','--user', help='login as this user')
    parser.add_argument('--verbosity')
    parser.add_argument('--version')
    args = vars(parser.parse_args()) # convert to dictionary

    play(args)
