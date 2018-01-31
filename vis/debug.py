import bdb
import sys
import time

from util.socketIO import SingleCallbackSocketIO
from vis.engine import VisualizationEngine


def _get_available_port(host):
    """
    Finds an unused port number on the given host.
    Args:
        host (str): The host address.

    Returns:
        int: An available port number.
    """
    raise NotImplementedError


class VisualDebugger(bdb.Bdb):
    SET_QUIT = 'debugger-quit'
    SET_CONTINUE = 'debugger-continue'
    SET_STEP = 'debugger-step'
    LOAD_SYMBOL = 'debugger-load-symbol'

    def __init__(self):
        super(VisualDebugger, self).__init__()
        port = _get_available_port('localhost')
        self.viz_engine = VisualizationEngine()
        self.server = None  # spin up Node.js server as subprocess on the given port
        self.socket = SingleCallbackSocketIO('localhost', port)  # blocks until the port is opened
        self.add_socket_callbacks()
        self.keep_waiting = False

    def add_socket_callbacks(self):
        """Adds callbacks to self.socket to handle requests from server."""
        self.socket.on(self.SET_QUIT, self.set_quit)
        self.socket.on(self.SET_STEP, self.set_step)
        self.socket.on(self.SET_CONTINUE, self.set_continue)
        self.socket.on(self.LOAD_SYMBOL, self.load_symbol)

    def load_symbol_callback(self, *args):
        """A socket.io-style callback wrapper for load_symbol."""
        self.keep_waiting = True
        return self.load_symbol(args[0])

    def load_symbol(self, symbol_id):
        """
        Loads and returns the JSON representation of a requested symbol.
        Args:
            symbol_id (str): The name of the requested symbol.

        Returns:
            str: A JSON-style representation of the symbol.
        """
        symbol_dict = self.viz_engine.generate(symbol_id)
        return self.viz_engine.to_json(symbol_dict)

    def wait_for_request(self):
        """Waits for a request from the server, looping if the callback is not terminal."""
        self.keep_waiting = True
        while self.keep_waiting and not self.quitting:
            self.keep_waiting = False
            self.socket.wait(one_callback=True)

    # Required overrides from bdb
    def user_call(self, frame, argument_list):
        """Invoked when a function is called. Waits for server requests if the debugger should stop."""
        if self.stop_here(frame):
            self.wait_for_request()

    def user_exception(self, frame, exc_info):
        """Invoked when an exception occurs at or just below the debugger."""
        raise NotImplementedError

    def user_line(self, frame):
        """Invoked when the debugger stops or breaks on a line. Waits for a request from the server."""
        self.wait_for_request()

    def user_return(self, frame, return_value):
        """Called when a return trap is set at frame. Waits for a request from the server."""
        self.wait_for_request()

    def do_clear(self, arg):
        """With a space separated list of breakpoint numbers, clear
        those breakpoints.  Without argument, clear all breaks (but
        first ask confirmation).  With a filename:lineno argument,
        clear all breaks at that line in that file."""
        raise NotImplementedError


def set_trace():
    VisualDebugger().set_trace(sys._getframe().f_back)

