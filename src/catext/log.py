import datetime
import os
import sys

import config as cfg

class Logger(object):

    def __init__(self, name):

        self.name = name.lower()

        self.file = cfg.get_path('logs','ct_{}.log'.format(self.name))
        self.root = cfg.get_path('logs','root.log')

        verbosity = cfg.env.get('VERBOSITY','CRITICAL')
        debug = True if cfg.env.get('DEBUG') == '1' else 0

        levels = ['CRITICAL','ERROR','WARN','INFO','DEBUG']
        try:
            self.level = levels.index(verbosity)
            self.level_name = levels[self.level]
        except ValueError:
            print('LoggerError: invalid level: {}'.format(level))
            self.level = 1
            self.level_name = 'INVALID_LOGGING_LEVEL'

        self.force_debug = debug or self.level == 4

        self.write(file=self.file, message='\n\n\n')
        self.debug('Logger initialized ({})'.format(self))


    def format(self, show_time=True, prefix=None, message=''):

        string = ''
        if show_time:
            string += '[{}] '.format(get_time())
        string += '{} '.format(self.name)
        if prefix is not None:
            string += '{}: '.format(prefix)
        string += str(message)
        string += '\n'

        return string


    def write(self, file='', message=''):

        with open(file, 'a') as f:
            f.write(message)


    def handle(self, message, file, prefix, level):

        message = self.format(prefix=prefix, message=message)

        if self.level >= level:
            #sys.stderr.write(message)
            if self.file != self.root:
                self.write(file=self.file, message=message)
        if self.force_debug or self.level >= level or level < 2:
            self.write(file=self.root, message=message)

    def critical(self, message, file='main'):
        self.handle(message, file, 'CRITICAL', 0)

    def error(self, message, file='main'):
        self.handle(message, file, 'ERROR', 1)

    def warn(self, message, file='main'):
        self.handle(message, file, 'WARN', 2)

    def info(self, message, file='main'):
        self.handle(message, file, 'INFO', 3)

    def debug(self, message, file='main'):
        self.handle(message, file, 'DEBUG', 4)


    def __repr__(self):
        return 'Logger (name={}, level={}, debug={})'.format(self.name, self.level_name, self.force_debug)

def get_time():
    return str(datetime.datetime.now())
