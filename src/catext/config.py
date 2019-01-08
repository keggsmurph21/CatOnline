import os





# default values

def get_path(*paths):
    ''' get path under project root '''
    return os.path.join(root, *paths)

root = os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
