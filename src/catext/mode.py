import os

import config as cfg

from api import APIError

__all__ = ['Home', 'Lobby', 'Play']

class Mode(object):
    def __init__(self, name):

        cfg.cli_logger.debug('initializing Mode (name={})'.format(name))

        self.width = cfg.env.get('TERM_WIDTH')
        self.name = name

    def __repr__(self):
        return 'Mode (type={}, name={})'.format(self.__class__.__name__, self.name)

    def get_banner_text(self, *args):

        current_user = cfg.env.get('CURRENT_USER', None)

        if current_user is '':

            banner_text = '<< CaTexT : {} >>'.format(self.name)
            banner_pad  = int((self.width - len(banner_text))/2) - 1
            banner_text = '{}{}'.format(' '*banner_pad, banner_text)

        else:

            left_banner = ' CaTexT ({})'.format(self.name)
            right_banner= 'logged in as {}'.format(current_user)
            banner_pad = self.width - len(left_banner) - len(right_banner) - 1
            banner_text = '{}{}{}'.format(left_banner, ' '*banner_pad, right_banner)

        cfg.cli_logger.debug('Mode banner text : "{}"'.format(banner_text))

        return banner_text

    def get_main_text(self, *args):
        return []

    def get_status_text(self, *args):
        return ''

    def get_input_text(self, *args):
        return ''

    def set_as_current(self, *args):

        cfg.cli_logger.debug('Current mode: {}'.format(self))

        cfg.cli.set_banner(self.get_banner_text())
        cfg.cli.set_main(self.get_main_text(*args))
        cfg.cli.set_status(self.get_status_text(*args))

        return self

    def loop(self):         raise NotImplementedError

    def parse_input(self):

        input = cfg.cli.input()
        if input is None:
            return '', None, None

        cfg.app_logger.info('parsing string: "{}"'.format(input))
        words = input.split(' ')
        command = words[0]
        args = []
        kwargs = {}

        i = 1

        while i < len(words):

            word = words[i]
            if word[0] == '-':
                kwargs[word.strip('-')] = words[i+1]
                i += 2
            else:
                args.append(word)
                i += 1

        cfg.app_logger.info('parsed string: {}, {}, {}'.format(command, args, kwargs))
        return command, args, kwargs


class Home(Mode):
    def get_main_text(self):

        lines = ['','   Welcome to CaTexT','']
        users = os.listdir(cfg.env.get('USERS_ROOT'))
        if len(users):
            lines.append('SAVED LOGINS:')
            lines += [' - {}'.format(user) for user in users]
        else:
            lines.append('NO SAVED LOGINS')

        return lines

    def get_status_text(self):
        return 'Log in with your CatOnline credentials'

    def loop(self):
        '''
        TODO: change this docstring
        generates a list of available users to select from, or enables
        the user to login thru the web endpoint

        @return User() corresponding to the choice
        '''

        user = cfg.current_user

        if user is None:
            cfg.app_logger.debug('selecting user')
            default_user = cfg.env.get('DEFAULT_USER')
            cfg.app_logger.debug('default user: {}'.format(default_user))
            user = cfg.app.get_user(default_user)

        while user is None:

            cfg.app_logger.debug('unable to log in with default user')
            username = cfg.cli.input(' - username: ')
            user = cfg.app.get_user(username)

            cfg.app_logger.debug('username: "{}" ({})'.format(username, len(username)))
            if user is None and len(username):
                password = cfg.cli.input(' - password: ', visible=False)
                cfg.app_logger.debug('attempting login (username={}, password={})'.format(username,'*'*len(password)))
                cfg.cli.set_status('Querying CatOnline database ... ')
                user = cfg.app.save_user(username, password)

        cfg.current_user = user
        cfg.cli.set_status('Successfully logged in as {}'.format(cfg.current_user.name))
        cfg.env.set('CURRENT_USER', cfg.current_user.name)
        cfg.app_logger.info('current user: {}'.format(cfg.current_user.name))

        cfg.app.lobby()

class Lobby(Mode):

    def get_players_string(self, game):
        if game['status'] == 'in-progress':
            return '{:2}'.format(len(game['players']))
        elif game['status'] == 'ready':
            return '{:2}'.format(len(game['players']))
        elif game['status'] == 'pending':
            return '{:2}/{:2}'.format(len(game['players']), game['settings']['numHumans'])

    def check_if_user_in_game(self, game):
        user = cfg.current_user

        for player in game['players']:
            if player['name'] == user.name:
                return True

        return False

    def print_game_list(self, title='', games=[], count=1, lines=[]):

        if len(games):
            lines.append(title)
            lines.append('  num    id         author      players      last updated')
            lines.append(' ---- -------- ---------------- ------- ----------------------')
            for i, game in enumerate(games):
                gamestring = ' {:3}) {:8} {:^16} {:^7} {:<22}'.format(count
                    , game['id'][-8:]
                    , game['author']['name']
                    , self.get_players_string(game)
                    , game['updated'] )
                lines.append(gamestring)
                count += 1
            lines.append('')

        return count

    def get_main_text(self, args):

        games = args['games']

        split_games = { 'top':[], 'middle':[], 'bottom':[] }
        for game in games:

            user_in_game = self.check_if_user_in_game(game)
            if game['status'] == 'in-progress':
                if user_in_game:
                    split_games['top'].append(game)
            else:
                if user_in_game:
                    split_games['middle'].append(game)
                elif not(game['isFull']):
                    split_games['bottom'].append(game)

        count, lines = 1, []
        count = self.print_game_list(title='IN-PROGRESS', games=split_games['top'], count=count, lines=lines)
        count = self.print_game_list(title='PENDING', games=split_games['middle'], count=count, lines=lines)
        count = self.print_game_list(title='AVAILABLE', games=split_games['bottom'], count=count, lines=lines)

        return lines

    def get_status_text(self, args):

        status = ''
        if 'response' in args:
            if args['response']['action'] == 'ERROR':
                status = args['response']['message']
            else:
                status = args['response']['action']

        return status

    def loop(self):

        while True:

            command, options, payload = self.parse_input()

            if command == '':
                continue
            if command == 'quit':
                cfg.app.quit()
            elif command == 'logout':
                cfg.app.logout()
            elif command == 'refresh':
                try:
                    data = cfg.api.lobby(cfg.current_user.token)
                    cfg.cli.change_mode('lobby', data)
                except APIError as e:
                    raise e
            elif command == 'new' or command == 'new_game':
                for param_type in cfg.new_game_form:
                    for param_name in cfg.new_game_form[param_type]:
                        param = cfg.new_game_form[param_type][param_name]
                        if param['short'] not in payload:
                            payload[param_name] = param['default']
                        else:
                            payload[param_name] = payload[param['short']]

                payload['action'] = 'new_game'
                cfg.app.lobby(payload)
            else:
                message = 'Unrecognized command: {}'.format(command)
                cfg.app_logger.error(message)
                cfg.cli.set_status(message)

class Play(Mode):
    pass
