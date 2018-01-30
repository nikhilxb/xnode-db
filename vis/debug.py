import bdb
from socketIO_client import SocketIO


QUIT_SIGNAL = 'debugger-quit'


def _get_open_port(host):
    # Returns the number of an open port on the given host.
    raise NotImplementedError


class VisualDebugger(bdb.Bdb):
    def __init__(self):
        super(VisualDebugger, self).__init__()
        port = _get_open_port('localhost')
        self.server = None  # spin up Node.js server as subprocess on the given port
        self.socket = SocketIO('localhost', port)  # blocks until the port is opened
        self.add_socket_callbacks()
        self.wait_for_request()

    def add_socket_callbacks(self):
        # Add all required .on listeners to the socket.
        self.socket.on(QUIT_SIGNAL, self.set_quit)
        raise NotImplementedError

    def wait_for_request(self):
        while not self.quitting:
            self.socket.wait()

    # Required overrides from bdb
    def user_call(self, frame, argument_list):
        raise NotImplementedError

    def user_exception(self, frame, exc_info):
        raise NotImplementedError

    def user_line(self, frame):
        raise NotImplementedError

    def user_return(self, frame, return_value):
        raise NotImplementedError

    def do_clear(self, arg):
        raise NotImplementedError
