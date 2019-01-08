import curses

import config as cfg

__all__ = ['StripWindow', 'SeparatorWindow', 'InputWindow', 'ScrollWindow']

class Window(object):
    def __init__(self, dimensions, prefix=''):

        cfg.cli_logger.debug('initializing Window (dimensions={})'.format(dimensions))

        # get dimensions of the strip for our newwin()
        self.height, self.width, self.start_y, self.start_x = dimensions
        self.win = curses.newwin(self.height, self.width, self.start_y, self.start_x)
        self.win.keypad(True)

        # save this prefix
        self.prefix = prefix

class StripWindow(Window):
    def __init__(self, y=-1, prefix=''):

        cfg.cli_logger.debug('initializing StripWindow (prefix="{}")'.format(prefix))
        super(StripWindow, self).__init__( (1, curses.COLS, y, 0), prefix=prefix)

        # variable string
        self.str_var = ''
        self.str_start = 0
        self.str_width = self.width - len(self.prefix)

        self.set('')

    def set(self, string, reset=False):
        self.str_var = str(string)
        self.str_start = 0 if reset else self.str_start
        cfg.cli_logger.debug('StripWindow str_var : "{}"'.format(self.str_var))
        self.refresh()

    def refresh(self):
        visible_str_var = self.str_var[self.str_start:self.str_start+self.str_width]
        visible_str = escape('{}{}'.format(self.prefix, visible_str_var))

        cfg.cli_logger.debug('StripWindow visibile_str : "{}"'.format(visible_str))
        self.win.addstr(0, 0, visible_str)
        self.win.clrtoeol()
        self.win.refresh()

class SeparatorWindow(StripWindow):
    def __init__(self, y=-1):

        cfg.cli_logger.debug('initializing SeparatorWindow')
        super(SeparatorWindow, self).__init__(y=y)
        self.set('-'*(curses.COLS-1))

class InputWindow(StripWindow):
    def __init__(self, y=-1, prefix='', scrollwindow=None):

        cfg.cli_logger.debug('initializing InputWindow (prefix="{}")'.format(prefix))
        self.default_prompt = ' > '
        super(InputWindow, self).__init__(y=y, prefix=self.default_prompt)
        self.scrollwindow = scrollwindow
        self.set_prompt()

    def set_prompt(self, prompt=None):
        cfg.cli_logger.debug('InputWindow prompt: {}'.format(prompt))
        self.prefix = self.default_prompt if prompt is None else prompt

        self.str_var = ''
        self.str_start = 0
        self.str_width = self.width - len(self.prefix)

        self.refresh()

    def listen(self, prompt='', visible=True, completions=None):

        cfg.cli_logger.debug('InputWindow listening')
        self.set_prompt(prompt)

        string = ''
        while True:
            try:
                key = self.win.getkey()
            except KeyboardInterrupt:
                cfg.cli_logger.critical('InputWindow received KeyboardInterrupt')
                cfg.app.quit()

            num = ord(key) if len(key)==1 else -1
            cfg.cli_logger.debug('InputWindow key "{}" ({})'.format(key, num))

            if num == 10: # <Enter>
                return string
            elif num == 27: # <Esc>
                pass
            elif num == 127: # <Backspace>
                if len(string):
                    y, x = self.win.getyx()
                    self.win.delch(y, x-1)
                    string = string[:-1]
                self.win.refresh()
            elif key == 'KEY_UP':
                self.scrollwindow.scroll_up()
            elif key == 'KEY_DOWN':
                self.scrollwindow.scroll_down()
            elif key == 'KEY_LEFT':
                pass
            elif key == 'KEY_RIGHT':
                pass
            else: # regular key
                string += key
                self.win.addstr(key if visible else '*')
                self.win.refresh()

    def wait(self):
        cfg.cli_logger.debug('InputWindow waiting')
        self.set_prompt(prompt='   press any key to continue ... ')
        self.win.getch()

class ScrollWindow(Window):
    def __init__(self, y=-1, height=-1):

        cfg.cli_logger.debug('initializing ScrollWindow')
        super(ScrollWindow, self).__init__((height, curses.COLS, y, 0))

        self.reset_strings()

    def scroll_up(self):
        cfg.cli_logger.debug('ScrollWindow try scroll up')
        if self.start_line > 0:
            cfg.cli_logger.debug('ScrollWindow scrolling up')
            self.start_line -= 1
            self.refresh()

    def scroll_down(self):
        cfg.cli_logger.debug('ScrollWindow try scroll down')
        if len(self.filtered_strings) > self.start_line + self.height:
            cfg.cli_logger.debug('ScrollWindow scrolling down')
            self.start_line += 1
            self.refresh()

    def refresh(self):
        for line_num in range(self.height):
            id = self.start_line + line_num
            string = self.filtered_strings[id].string if id < len(self.filtered_strings) else ''
            string = escape(string)
            if line_num == 0 and self.start_line > 0:
                string = ' <Up>'
            if line_num == self.height-1 and len(self.filtered_strings) - 1 > id:
                string = ' <Down>'
            self.win.addstr(line_num, 0, string)
            self.win.clrtoeol()
        self.win.refresh()

    def reset_strings(self):
        # variable string array
        self.all_strings = []
        self.filtered_strings = []
        self.string_filter_all = ['game', 'message', 'server', '<NONE>']
        self.string_filter = self.string_filter_all
        self.start_line = 0

    def set(self, strings, label='server'):

        self.reset_strings()
        
        for string in strings:
            string = ScrollString(string, len(self.all_strings), label)
            cfg.cli_logger.debug('ScrollWindow set string : "{}"'.format(string))
            self.all_strings.append(string)
        self.filter_strings(self.string_filter)
        self.refresh()

    def add(self, string, label='<NONE>'):
        string = ScrollString(string, len(self.all_strings), label)
        cfg.cli_logger.debug('ScrollWindow add string : "{}"'.format(string))
        self.all_strings.append(string)
        self.filter_strings(self.string_filter)
        self.refresh()

    def filter_strings(self, filter=None):
        self.string_filter = self.string_filter_all if filter is None else filter
        cfg.cli_logger.debug('ScrollWindow filtering strings with labels {}'.format(','.join(filter)))
        self.filtered_strings = [string for string in self.all_strings if string.is_in_filter(filter)]

class ScrollString(object):
    def __init__(self, string, id, label):

        # save this stuff
        self.string = string
        self.id = id
        self.label = label

        cfg.cli_logger.debug('initializing {}'.format(self))

    def is_in_filter(self, filter):
        return self.label in filter

    def __repr__(self):
        return 'ScrollString (string="{}", id={}, label={})'.format(self.string, self.id, self.label)

def escape(string):
    return string[:curses.COLS]
