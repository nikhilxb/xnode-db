import bdb
import socket
import sys
import atexit

from util.socketIO import SingleCallbackSocketIO
from viz.engine import VisualizationEngine
from subprocess import Popen


def _get_available_port(host, port_range):
    """
    Finds an unused port number on the given host.
    Args:
        host (str): The host address.
        port_range (int, int): The port range to check.

    Returns:
        int: An available port number.
    """
    port_start, port_end = port_range
    for port in range(port_start, port_end+1):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex((host, port))
        if result != 0:
            sock.close()
            return port
        sock.close()


class VisualDebuggerServerHandle:
    """A handle to a server used by the VisualDebugger."""
    def __init__(self, program_port_range, client_port_range):
        """
        Creates a new server process with the specified ports.
        Args:
            program_port_range (int, int): Range of ports for program-server communication.
            client_port_range (int, int): Range of ports for server-client communication.
        """
        # TODO un-hardcode these strings, especially the program location
        self.program_port = _get_available_port('localhost', program_port_range)
        self.client_port = _get_available_port('0.0.0.0', client_port_range)
        self.process = Popen(['node', '..\\server\\server.js', str(self.program_port), str(self.client_port)])
        atexit.register(self.cleanup)

    def cleanup(self):
        self.process.kill()


class VisualDebugger(bdb.Bdb):
    # TODO move these to a file shared with the server
    SET_QUIT = 'dbg-quit'
    SET_CONTINUE = 'dbg-continue'
    SET_STEP = 'dbg-step-over'
    LOAD_SYMBOL = 'dbg-load-symbol'
    EMIT_SCHEMA = 'dbg-emit-schema'

    _server = None

    def __init__(self, program_port_range=(3000, 5000), client_port_range=(8000, 9000)):
        """
        Initializes a new VisualDebugger object, which uses a server subprocess to relay information to clients.
        Programs should not instantiate multiple VisualDebugger objects.
        Args:
            program_port_range (int, int): The range of ports to sweep over for program-server communication.
            client_port_range (int, int): The range of ports to sweep over for server-client communication.
        """
        super(VisualDebugger, self).__init__()
        if self._server is None:
            VisualDebugger._server = VisualDebuggerServerHandle(program_port_range, client_port_range)
        self.socket = SingleCallbackSocketIO('localhost', self._server.program_port)  # blocks until the port is opened
        self.add_socket_callbacks()
        self.viz_engine = VisualizationEngine()
        self.keep_waiting = False

    def add_socket_callbacks(self):
        """Adds callbacks to self.socket to handle requests from server."""
        self.socket.on(self.SET_QUIT, self.set_quit)
        self.socket.on(self.SET_STEP, self.set_step)
        self.socket.on(self.SET_CONTINUE, self.set_continue)
        self.socket.on(self.LOAD_SYMBOL, self.load_symbol_callback)

    def load_symbol_callback(self, *args):
        """A socket.io-style callback wrapper for load_symbol."""
        self.keep_waiting = True
        self.socket.emit(self.EMIT_SCHEMA, args[0], self.load_symbol(args[0]))

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

