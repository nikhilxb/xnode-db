import atexit
import bdb
import socket
import sys
from subprocess import Popen
from socketIO_client import SocketIO

from viz.engine import VisualizationEngine


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


class SingleRequestSocketIO(SocketIO):
    """A SocketIO client object that can terminate waiting after receiving a single request.

    The Python socketIO_client library does not implement this functionality by default. We need it for the
    `VisualDebugger`, which after receiving step and continue commands should not endlessly wait on the server but
    instead continue normal code flow until another breakpoint is hit.
    """
    def __init__(self, *args, **kwargs):
        self.has_called_back = False
        super(SingleRequestSocketIO, self).__init__(*args, **kwargs)

    def _on_event(self, data_parsed, namespace):
        self.has_called_back = True
        super(SingleRequestSocketIO, self)._on_event(data_parsed, namespace)

    def _should_stop_waiting(self, for_namespace=False, for_callbacks=False, one_callback=False):
        if one_callback and self.has_called_back:
            self.has_called_back = False
            return True
        return super(SingleRequestSocketIO, self)._should_stop_waiting()


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
        print(self.program_port, self.client_port)
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
    DBG_STOP = 'dbg-stop'
    DBG_CONTINUE = 'dbg-continue'
    DBG_STEP_OVER = 'dbg-step-over'
    DBG_STEP_INTO = 'dbg-step-into'
    DBG_STEP_OUT = 'dbg-step-out'
    DBG_LOAD_SYMBOL = 'dbg-load-symbol'
    DBG_GET_NAMESPACE = 'dbg-get-namespace'
    DBG_GET_CONTEXT = 'dbg-get-context'

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
        self.socket = SingleRequestSocketIO('localhost', self._server.program_port)
        self.add_socket_callbacks()
        self.viz_engine = VisualizationEngine()
        self.keep_waiting = False
        self.current_frame = None
        self.current_stack = None
        self.current_stack_index = None
        self.callbacks_for_next_bp = []

    def add_socket_callbacks(self):
        """Adds callbacks to self.socket to handle requests from server.

        The server will send requests to the VisualDebugger object via their socket; when a request (formatted as a
        string) is received on the VisualDebugger, it calls the associated function. Note that callbacks are
        synchronous, and requests received during a callback will be executed after the callback is complete.
        """
        self.socket.on(self.DBG_STOP, self.quit_callback)
        self.socket.on(self.DBG_STEP_INTO, self.step_into_callback)
        self.socket.on(self.DBG_STEP_OUT, self.step_out_callback)
        self.socket.on(self.DBG_STEP_OVER, self.step_over_callback)
        self.socket.on(self.DBG_CONTINUE, self.continue_callback)
        self.socket.on(self.DBG_LOAD_SYMBOL, self.load_symbol_callback)
        self.socket.on(self.DBG_GET_NAMESPACE, self.get_namespace_shells_callback)
        self.socket.on(self.DBG_GET_CONTEXT, self.get_context_callback)

    def forget_frame(self):
        """Wipes the debugger's knowledge of the current frame and stack.

        Implementation comes from pdb.forget.
        """
        self.current_frame = None
        self.current_stack = None
        self.current_stack_index = None

    def reset(self):
        """Resets the debugger state completely.

        Extends bdb's default behavior to also clear the `VisualDebugger`'s knowledge of the current frame."""
        super(VisualDebugger, self).reset()
        self.forget_frame()

    def setup_at_break(self, frame):
        """Set the debugger's state to reflect the current frame and execute any waiting callbacks.

        This function is called when the debugger hits a break, and prepares its state so that future actions,
        like requesting symbols from the namespace, execute correctly. Any callbacks sent by the server that were
        supposed to execute at the next breakpoint, such as those requesting updated namespace information,
        are executed thereafter.
        Args:
            frame (frame): The frame at which the debugger is stopping.
        """
        self.forget_frame()
        self.current_stack, self.current_stack_index = self.get_stack(frame, None)
        self.current_frame = self.current_stack[self.current_stack_index][0]
        for callback in self.callbacks_for_next_bp:
            callback()
        self.callbacks_for_next_bp.clear()

    def quit_callback(self, *args):
        """A socket.io-style callback for the quit command.

        Assumes the first given argument is a callback function, which is executed before quitting.
        """
        args[0]()
        self.set_quit()

    def step_into_callback(self, *args):
        """A socket.io-style callback for the step-into command.

        Assumes the first given argument is a callback function, which is set to execute at the next breakpoint.
        """
        self.set_step()
        self.callbacks_for_next_bp.append(self.server_command_callback_wrapper(args[0]))

    def step_over_callback(self, *args):
        """A socket.io-style callback for the step-over command.

        Assumes the first given argument is a callback function, which is set to execute at the next breakpoint.
        """
        self.set_next(self.current_frame)
        self.callbacks_for_next_bp.append(self.server_command_callback_wrapper(args[0]))

    def step_out_callback(self, *args):
        """A socket.io-style callback for the step-out command.

        Assumes the first given argument is a callback function, which is set to execute at the next breakpoint.
        """
        self.set_return(self.current_frame)
        self.callbacks_for_next_bp.append(self.server_command_callback_wrapper(args[0]))

    def continue_callback(self, *args):
        """A socket.io-style callback for the step-out command.

        Assumes the first given argument is a callback function, which is set to execute at the next breakpoint.
        """
        self.set_continue()
        self.callbacks_for_next_bp.append(self.server_command_callback_wrapper(args[0]))

    def get_namespace_shells_callback(self, *args):
        """A socket.io-style callback for getting the shells of all symbols in the namespace.

        The server might at any time request the shells of all objects in the namespace (for example, when a new
        client connects, it would make this request). This function is called when such a request is made.

        Assumes the first given argument is a callback function, which is executed with the generated namespace
        representation as its argument.
        """
        self.keep_waiting = True
        callback_fn = args[0]
        callback_fn(self.viz_engine.to_json(self.get_namespace_shells()))

    def get_context_callback(self, *args):
        """A socket.io-style callback for getting the program's current context.

        The server might at any time request the status of the program, such as line number (all newly-connecting
        clients would need this information). This function is called when such a request is made.

        Assumes the first given argument is a callback function, which is executed with the context object as its
        argument.
        """
        self.keep_waiting = True
        callback_fn = args[0]
        callback_fn(self.get_context())

    def server_command_callback_wrapper(self, callback_fn):
        """Wraps a callback function which expects a debugger context and a namespace as a 0-argument function.

        When the server asks the debugger to update the runtime (via a step or continue), it sends a callback to be
        executed after the debugger has stopped again. This callback takes two arguments: a context object (which
        represents the state of the runtime, including file and line number) and a namespace object (which associates
        symbol IDs with shell dictionaries describing them). These functions are not executed until the next
        breakpoint, at which point every enqueued callback is run. All of these callbacks must have 0 arguments (for
        generality), so we create a 0-argument version of the runtime update callback here.
        """
        def _callback():
            context = self.get_context()
            namespace = self.get_namespace_shells()
            callback_fn(context, namespace)
        return _callback

    def load_symbol_callback(self, *args):
        """A socket.io-style callback wrapper for load_symbol.

        When the server asks to load the visualization of a symbol, it sends the symbol ID and a callback function
        (which relays the loaded symbol to the client). The VisualDebugger loads the symbol and then calls the
        callback. Responding to this request should not cause the VisualDebugger to stop reading from the socket.
        """
        self.keep_waiting = True
        symbol_id, callback_fn = args[0], args[1]
        callback_fn(*self.load_symbol(symbol_id))

    def load_symbol(self, symbol_id):
        """Loads and returns the JSON representation of a requested symbol.

        Args:
            symbol_id (str): The name of the requested symbol.

        Returns:
            str: A JSON-style representation of the symbol.
        """
        # The actual work of visualization is done by the `VisualizationEngine` instance owned by the `VisualDebugger`.
        symbol_data, new_shells = self.viz_engine.get_symbol_data(symbol_id)
        return self.viz_engine.to_json(symbol_data), self.viz_engine.to_json(new_shells)

    def get_context(self):
        """Returns some object, for now a string, capturing the state of the program.

        The client will need to show users where the program has stopped, and some context information is requried.
        This information is sent as part of a typical callback after
        Returns:
            str: The file and line number of the Python program's current line.
        """
        return self.format_stack_entry(self.current_stack[self.current_stack_index])

    def get_namespace_shells(self):
        """Returns a dictionary mapping string symbol IDs to dictionary shell representations.

        See `VisualizationEngine` for more information about the shell representation format.

        Returns:
            dict: Shells for all symbols in the namespace.
        """
        joined_namespace = dict(self.current_frame.f_globals)
        joined_namespace.update(self.current_frame.f_locals)
        return self.viz_engine.get_namespace_shells(joined_namespace)

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
            self.setup_at_break(frame)
            self.wait_for_request()

    def user_exception(self, frame, exc_info):
        """Invoked when an exception occurs at or just below the debugger at a place where the debugger should stop."""

        # Taken from pdb; unsure how important this is. TODO look into this more
        exc_type, exc_value, exc_traceback = exc_info
        frame.f_locals['__exception__'] = exc_type, exc_value
        self.setup_at_break(frame)
        self.wait_for_request()

    def user_line(self, frame):
        """Invoked when the debugger stops or breaks on a line. Waits for a request from the server."""
        self.setup_at_break(frame)
        self.wait_for_request()

    def user_return(self, frame, return_value):
        """Called when a return trap is set at frame. Waits for a request from the server."""
        self.setup_at_break(frame)
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

    This mimics the function of the same name in pdb, and minimizes changes to style and practice required in
    switching from pdb to viz.debug. Crowding the runtime with multiple VisualDebugger objects is not terribly
    problematic, as at most one debugging server is created in each run.
    """
    VisualDebugger().set_trace(sys._getframe().f_back)

