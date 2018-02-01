import bdb
import socket
import sys
import atexit

from util.socketIO import SingleCallbackSocketIO
from viz.engine import VisualizationEngine
from subprocess import Popen


def _get_available_port(host, port_range):
    """Finds an unused port number on the given host.

    We need to be able to find available ports for the VisualDebuggerServer; we at least need to be able to find the
    port on which to open the socket.io connection in the Python program so that the VisualDebugger object has that
    information. We have also chosen to find the client port with this code so as not to rewrite this functionality
    in the Node.js server. Passing the port as a parameter to the Node.js server simply replaces the need to pass an
    acceptable port range (specified by the user in VisualDebugger instantiation) as a parameter instead.

    Args:
        host (str): The host address.
        port_range (int, int): The port range to check (inclusive).

    Returns:
        int: An available port number.
    """
    # An attempted socket connection will return 0 if something is listening on the socket, so we skip over it.
    port_start, port_end = port_range
    for port in range(port_start, port_end+1):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex((host, port))
        if result != 0:
            sock.close()
            return port
        sock.close()


class VisualDebuggerServerHandle:
    """An object used to keep a reference to the debugging server process and the ports on which it communicates.

    We would like multiple VisualDebugger objects to connect to the same server, so it is helpful to have some
    wrapper that contains all the information necessary to make that connection.
    """
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
    """A debugger object which spawns and uses a server to relay visualizations of runtime variables to clients.

    The object is instantiated much like a pdb debugger, and has the functionality provided by bdb, but is controlled
    by the server (via a socket) rather than the command line. The VisualDebugger is used to control the program flow
    and to instruct its VisualizationEngine to transform requested symbols in the Python runtime to useful
    visualization schema. The VisualizationEngine manages the task of actually interacting with Python objects for
    visualization purposes, limiting the scope of VisualDebugger functionality to typical debugger tasks,
    like stepping, continuing, and quitting.
    """

    # ==================================================================================================================
    # socket.io requests the VisualDebugger understands.
    # ----------------------------------
    # These strings are emitted by the server to the VisualDebugger over the socket between them. If one of these
    # strings is changed, it must also be changed in server.js (and vice versa).
    # ==================================================================================================================
    SET_QUIT = 'dbg-quit'
    SET_CONTINUE = 'dbg-continue'
    SET_STEP = 'dbg-step-over'
    LOAD_SYMBOL = 'dbg-load-symbol'

    # ==================================================================================================================
    # A static reference to a VisualDebuggerServerHandle.
    # ----------------------------------
    # It is possible and likely that multiple VisualDebugger objects are created in a single program. We would like
    # to reuse the same debugging server for all of these objects, so we update the static reference once in the
    # first-created VisualDebugger and then use it in all subsequently created VisualDebugger instances.
    # ==================================================================================================================
    _server = None
    # ==================================================================================================================

    def __init__(self, program_port_range=(3000, 5000), client_port_range=(8000, 9000)):
        """Instantiates the debugging server if needed, connects to the socket between them, and prepares for requests.

        Args:
            program_port_range (int, int): The range of ports to sweep over for program-server communication.
            client_port_range (int, int): The range of ports to sweep over for server-client communication.
        """
        super(VisualDebugger, self).__init__()
        if self._server is None:
            VisualDebugger._server = VisualDebuggerServerHandle(program_port_range, client_port_range)
        # TODO un-hardcode this string
        self.socket = SingleCallbackSocketIO('localhost', self._server.program_port)
        self.add_socket_callbacks()
        self.viz_engine = VisualizationEngine()
        self.keep_waiting = False

    def add_socket_callbacks(self):
        """Adds callbacks to self.socket to handle requests from server.

        The server will send requests to the VisualDebugger object via their socket; when a request (formatted as a
        string) is received on the VisualDebugger, it calls the associated function. Note that callbacks are
        synchronous, and requests received during a callback will be executed after the callback is complete.
        """
        self.socket.on(self.SET_QUIT, self.set_quit)
        self.socket.on(self.SET_STEP, self.set_step)
        self.socket.on(self.SET_CONTINUE, self.set_continue)
        self.socket.on(self.LOAD_SYMBOL, self.load_symbol_callback)

    def load_symbol_callback(self, *args):
        """A socket.io-style callback wrapper for load_symbol.

        When the server asks to load the visualization of a symbol, it sends the symbol id and a callback function
        (which relays the loaded symbol to the client). The VisualDebugger loads the symbol and then calls the
        callback. Responding to this request should not cause the VisualDebugger to stop reading from the socket.
        """
        self.keep_waiting = True
        symbol_id, callback_fn = args[0], args[1]
        callback_fn(self.load_symbol(symbol_id))

    def load_symbol(self, symbol_id):
        """
        Loads and returns the JSON representation of a requested symbol.

        Args:
            symbol_id (str): The name of the requested symbol.

        Returns:
            str: A JSON-style representation of the symbol.
        """
        # The actual work of visualization is done by the VisualizationEngine instance owned by the VisualDebugger.
        symbol_dict = self.viz_engine.generate(symbol_id)
        return self.viz_engine.to_json(symbol_dict)

    def wait_for_request(self):
        """Waits for a request from the server, looping if the callback is not terminal.

        Calling this function waits for at least one request on the socket. By default, the loop breaks after the
        first callback is completed, but callbacks can optionally request to keep the loop going.
        """
        # We enter the loop at least once, but will break out if keep_waiting is not set to True in the request
        # callback.
        self.keep_waiting = True
        while self.keep_waiting and not self.quitting:
            self.keep_waiting = False
            self.socket.wait(one_callback=True)

    # ==================================================================================================================
    # Bdb overrides.
    # ----------------------------------
    # Implementation and invocation info is taken from pdb. Pdb also also skips over any of these calls when the code
    # is not from the main Python file; when we implement run(), TODO we will likely need to add support for this.
    # ==================================================================================================================
    def user_call(self, frame, argument_list):
        """Invoked when a function is called. Waits for server requests if the debugger should stop."""
        if self.stop_here(frame):
            self.wait_for_request()

    def user_exception(self, frame, exc_info):
        """Invoked when an exception occurs at or just below the debugger at a place where the debugger should stop."""

        # Taken from pdb; unsure how important this is. TODO look into this more
        exc_type, exc_value, exc_traceback = exc_info
        frame.f_locals['__exception__'] = exc_type, exc_value
        self.wait_for_request()

    def user_line(self, frame):
        """Invoked when the debugger stops or breaks on a line. Waits for a request from the server."""
        self.wait_for_request()

    def user_return(self, frame, return_value):
        """Called when a return trap is set at frame. Waits for a request from the server."""
        self.wait_for_request()

    def do_clear(self, arg):
        """Clears breakpoints specified by arg.

        A required implementation of bdb, used at least when a temporary breakpoint is hit.
        Args:
            arg (None): An optional argument specifying which breakpoints to clear, but not used here.
        """
        # TODO implement deletions of breakpoints at specific lines.
        self.clear_all_breaks()


# ======================================================================================================================
# Module-level debugging functions.
# ======================================================================================================================
def set_trace():
    """A convenience function which instantiates a VisualDebugger object and sets trace at the current frame.

    This mimics the function of the same name in pdb, and minimizes changes to style and practice requried in
    switching from pdb to viz.debug. Crowding the runtime with multiple VisualDebugger objects is not terribly
    problematic, as at most one debugging server is created in each run.
    """
    VisualDebugger().set_trace(sys._getframe().f_back)

