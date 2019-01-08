import json
import os
import requests
import socket
import sys

import config as cfg

__all__ = ['choose_api', 'APIError', 'APIConnectionError', 'APIInvalidDataError']

def choose_api(name):
    if name == 'http':
        return HTTP
    elif name == 'udp':
        return UDP
    else:
        raise APIError('Unknown interface ({})'.format(name))


class API(object):
    def __init__(self):     raise NotImplementedError
    def get_uri(self):      raise NotImplementedError
    def login(self):        raise NotImplementedError
    def signup(self):       raise NotImplementedError
    def lobby(self):        raise NotImplementedError
    def play(self):         raise NotImplementedError


class HTTP(API):
    def __init__(self):

        cfg.api_logger.debug('HTTP API initializing ...')

        protocol = cfg.env.get('PROTOCOL', 'http')
        host = cfg.env.get('HOST', 'localhost')
        port = cfg.env.get('PORT', 49160)

        # save webroot as combination of these
        self.webroot = '{}://{}:{}'.format(protocol, host, port)

        cfg.api_logger.debug('... API initialized (webroot: {})'.format(self.webroot))

    def get_uri(self, path):
        ''' get a URI for API endpoint '''
        return os.path.join(self.webroot, 'api', path)

    def login(self, username, password):
        '''
        post to the $WEBROOT/api/login endpoint
        note: this function prompts the user for password

        @return auth token or None
        '''

        payload = { 'username':username, 'password':password }
        uri = self.get_uri('login')
        return self.post(uri, payload)

    def lobby(self, token, payload=None):
        '''
        post to the $WEBROOT/api/lobby endpoint
        note: this function prompts the user for password

        @return data
        '''

        # make sure we include our auth token
        headers = { 'x-access-token':token }
        uri = self.get_uri('lobby')

        if payload is None:
            return self.get(uri, headers)
        else:
            return self.post(uri, payload, headers)

    def play(self, payload=None):
        if payload is None:
            self.get()
        else:
            self.post()

    def get(self, uri, headers={}):
        try:
            # hit the endpoint
            cfg.api_logger.info('get {}'.format(uri))
            res = requests.get(uri, headers=headers)
            cfg.api_logger.info('response code: {}'.format(res.status_code))

            if res.status_code == 200:
                # valid response
                cfg.api_logger.debug('response: {}'.format(res.text))
                return json.loads(res.text)
            else:
                # something went wrong
                raise APIInvalidDataError(res.text)

        except requests.exceptions.ConnectionError:
            raise APIConnectionError('Unable to connect to server at "{}"'.format(uri))

    def post(self, uri, payload, headers={}):
        try:
            # hit the endpoint
            cfg.api_logger.info('post {} (payload: {})'.format(uri, json.dumps(payload)))
            res = requests.post(uri, data=payload, headers=headers)
            cfg.api_logger.info('response code: {}'.format(res.status_code))

            if res.status_code == 200:
                # valid response
                cfg.api_logger.debug('response: {}'.format(res.text))
                return json.loads(res.text)
            else:
                # something went wrong
                raise APIInvalidDataError(res.text)

        except requests.exceptions.ConnectionError:
            raise APIConnectionError('Unable to connect to server at "{}"'.format(uri))


class UDP(API):
    def __init__(self):

        cfg.api_logger.debug('UDP API initializing ...')

        catonlinePath = cfg.env.get('CATONLINE_PATH')
        socketPath = cfg.env.get('CATONLINE_UDP_PATH')
        socketFile = cfg.env.get('CATONLINE_UDP_SOCKET')
        self.socketPath = os.path.join(catonlinePath, socketPath, socketFile)
        self.socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        try:
            self.socket.connect(self.socketPath)
        except socket.error as e:
            raise APIConnectionError('Unable to connect to UDP socket at {}'.format(self.socketPath))

    def receive(self):
        BUFF_SIZE = 4096 # 4 KiB
        data = b''
        while True:
            part = self.socket.recv(BUFF_SIZE)
            data += part
            if len(part) < BUFF_SIZE:
                # either 0 or end of data
                break
        return data

    def talk(self, message):

        message = json.dumps(message)
        message = message.encode()

        try:
            self.socket.sendall(message)
            response = self.receive()
            response = response.decode()
            response = json.loads(response)
            return response

        except socket.error as e:
            print(e)
            sys.exit(1)

    def get_uri(self, path):
        raise NotImplementedError

    def login(self, username, password):
        payload = {
            'location': 'login',
            'body': {
                'username': username,
                'password': password
            }
        }
        response = self.talk(payload)

        return response

    def lobby(self, token, payload=None):

        payload = {'body':{}} if payload is None else {'body':payload}

        payload['location'] = 'lobby'
        payload['token'] = token
        response = self.talk(payload)

        return response

    def play(self, payload=None):
        raise NotImplementedError

class APIError(Exception): pass
class APIConnectionError(APIError): pass
class APIInvalidDataError(APIError): pass
