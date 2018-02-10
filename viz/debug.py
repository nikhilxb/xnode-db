import atexit
import bdb
import socket
import sys
from subprocess import Popen
from socketIO_client import SocketIO

from viz.engine import VisualizationEngine


def _get_available_port(host, port_range):
    """Finds an unused port number on the given host.

    The `VisualDebuggerServerHandle` needs to find a local port over which it can communicate with the `VisualDebugger`
    object that interfacts with the Python program. We have also chosen to find the client port with this code so as
    not to rewrite this functionality in the Node.js server.

    Args:
        host (str): An IP address to scan for open ports.
        port_range (int, int): The port range to check (inclusive).

    Returns:
        (int): An available port number, or -1 if no port was available.
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
    return -1


class SingleRequestSocketIO(SocketIO):
    """An extension of the `SocketIO` client which stops reading from the socket after the server sends a request.

    The superclass `SocketIO` client blocks as it waits for a new message on the socket, after which it executes a
    callback and resumes waiting again. It will only break after a set timeout elapses. The `SingleRequestSocketIO`
    will not resume waiting after the first callback completes. This is useful for the `VisualDebugger`, which should
    stop waiting after receiving, for example, the CONTINUE command.
    """
    def __init__(self, *args, **kwargs):
        """Add a field to track whether a callback has been received before opening the socket.

        Users should also set the kwarg `one_callback` to `True` in init; otherwise, the instance will behave like
        any other socket.io client.
        """
        self.has_called_back = False
        super(SingleRequestSocketIO, self).__init__(*args, **kwargs)

    def _on_event(self, data_parsed, namespace):
        """Called when a request has been made over the socket."""
        self.has_called_back = True
        super(SingleRequestSocketIO, self)._on_event(data_parsed, namespace)

    def _should_stop_waiting(self, for_namespace=False, for_callbacks=False, one_callback=False):
        """A check socket.io runs regularly to determine if it should stop waiting for server requests."""
        if one_callback and self.has_called_back:
            self.has_called_back = False
            return True
        return super(SingleRequestSocketIO, self)._should_stop_waiting()


class VisualDebuggerServerHandle:
    """Maintains a reference to the debugging server process and the ports on which it communicates.

    Any number of `VisualDebugger` objects can be created in a single program; in fact, each call to set_trace()
    creates a new instance. The most recently created instance takes control of the program, so it will need a server
    with which to receive inputs and send outputs to clients. Rather than create a new server process for every
    `VisualDebugger` created, we can instead connect the currently in-charge debugger to the first (and only) created
    server process. This object helps us create a consistent process that persists beyond a debugger instance.
    """

    # The address on which to find a port and open the socket between the server and the debugger.
    LOCALHOST = 'localhost'

    # TODO make this deployment-ready
    SERVER_PROGRAM_PATH = r'..\server\server.js'

    def __init__(self, program_port_range, client_port_range):
        """Creates a new server process with the specified ports.

        Args:
            program_port_range (int, int): Range of ports for program-server communication.
            client_port_range (int, int): Range of ports for server-client communication.
        """
        self.program_port = _get_available_port(self.LOCALHOST, program_port_range)
        self.client_port = _get_available_port(self.LOCALHOST, client_port_range)
        print('Debugging server started on port {}, communicating with program on port {}'.format(self.client_port,
                                                                                                  self.program_port))
        self.process = Popen(['node', self.SERVER_PROGRAM_PATH, str(self.program_port), str(self.client_port)])
        atexit.register(self.cleanup)

    def cleanup(self):
        self.process.kill()


class VisualDebugger(bdb.Bdb):
    """A debugger object which spawns and uses a server to relay visualizations of runtime variables to clients.

    The object is instantiated much like a `pdb` debugger, and has the functionality provided by `bdb`, but is
    controlled by the server (via a socket) rather than the command line. The `VisualDebugger` is used to control the
    program flow and to instruct its `VisualizationEngine` to transform requested symbols in the Python runtime to
    useful visualization schema. The VisualizationEngine manages the task of actually interacting with Python objects
    for visualization purposes, limiting the scope of `VisualDebugger` functionality to typical debugger tasks (e.g.
    step, continue, quit, etc).
    """

    # A static reference to a VisualDebuggerServerHandle.
    # We would like to reuse the same debugging server regardless of the number of `VisualDebugger` objects created
    # in the program, so we update the static reference exactly once in the first-created `VisualDebugger`.
    _server = None

    # ==================================================================================================================
    # Messages for server-debugger communication.
    # -------------------------------------------
    # These strings are emitted by the server to the VisualDebugger over the socket between them. If one of these
    # strings is changed, it must also be changed in server.js (and vice versa).
    # ==================================================================================================================

    DBG_STOP = 'dbg-stop'                           # terminate the program immediately
    DBG_CONTINUE = 'dbg-continue'                   # continue normal program flow until a new breakpoint is reached
    DBG_STEP_OVER = 'dbg-step-over'                 # step one line forward without stepping down into function calls
    DBG_STEP_INTO = 'dbg-step-into'                 # step one line forward, stepping down into any function calls
    DBG_STEP_OUT = 'dbg-step-out'                   # continue normal program flow until the current function exits
    DBG_LOAD_SYMBOL = 'dbg-load-symbol'             # return the data object for a given symbol
    DBG_GET_NAMESPACE = 'dbg-get-namespace'         # return the shells of all Python objects in the current namespace
    DBG_GET_CONTEXT = 'dbg-get-context'             # return the context object defining the current program state

    def __init__(self, program_port_range=(3000, 5000), client_port_range=(8000, 9000)):
        """Instantiates the debugging server if not already running, connects to it via a socket, and prepares for
        requests.

        Args:
            program_port_range (int, int): The range of ports to sweep over for program-server communication.
            client_port_range (int, int): The range of ports to sweep over for server-client communication.
        """
        super(VisualDebugger, self).__init__()
        if self._server is None:
            VisualDebugger._server = VisualDebuggerServerHandle(program_port_range, client_port_range)

        # TODO un-hardcode this string
        # This line will hang until the socket connection is established.
        self.socket = SingleRequestSocketIO(self._server.LOCAL_ADDRESS, self._server.program_port)
        self._attach_socket_callbacks()

        # Instance variables.
        # -------------------

        # The visualization engine that generates and caches all visualizations for this debugger.
        self.viz_engine = VisualizationEngine()

        # Indicates whether the debugger should wait for another request from the server, or stop listening.
        # Commands such as continue and step_over should not be waited after, so the program can continue until the
        # next breakpoint. Sending data, via a load_symbol_data call, should be waited after so that additional
        # requests may be handled.
        self.keep_waiting = True

        # An object describing the frame in which the program is currently halted; used to provide a point of
        # reference to debugging functions. For example, step_over must know the current frame so that it can
        # continue until it reaches the next line in that frame.
        self.current_frame = None

        # An object describing the program's current stack; used to generate program context and acquire the current
        # frame. Current_stack encodes information such as the currently running file and line number.
        self.current_stack = None

        # An index into current_stack, indicating where the program execution currently resides in it and where
        # context information should be extracted from.
        self.current_stack_index = None

        # A list of callback functions to be executed once at the next encountered breakpoint. When the server issues
        # a control flow command, it will typically ask that a callback be executed when the command terminates. Such
        # callbacks would be added to this list, called when the program has halted again.
        self.next_breakpoint_callbacks = []

    def _attach_socket_callbacks(self):
        """Adds callbacks to self.socket to handle requests from server.

        The server will send requests to the VisualDebugger object via their socket; when a request (formatted as a
        string) is received on the VisualDebugger, it calls the associated function. Note that callbacks are
        synchronous, and requests received during a callback will be executed after the callback is complete.
        """
        self.socket.on(self.DBG_STOP, self.callback_stop)
        self.socket.on(self.DBG_STEP_INTO, self.callback_step_into)
        self.socket.on(self.DBG_STEP_OUT, self.callback_step_out)
        self.socket.on(self.DBG_STEP_OVER, self.callback_step_over)
        self.socket.on(self.DBG_CONTINUE, self.callback_continue)
        self.socket.on(self.DBG_LOAD_SYMBOL, self.callback_load_symbol)
        self.socket.on(self.DBG_GET_NAMESPACE, self.callback_get_namespace_shells)
        self.socket.on(self.DBG_GET_CONTEXT, self.callback_get_context)

    def forget_frame(self):
        """Wipes the debugger's knowledge of the current frame and stack.

        This should be called whenever a new break point is encountered, or when the debugger should
        reset itself. The debugger "forgets" everything it knows about the program's current frame and
        stack. Implementation comes from pdb.forget.
        """
        self.current_frame = None
        self.current_stack = None
        self.current_stack_index = None

    def reset(self):
        """Extends `bdb`'s default behavior to also clear the `VisualDebugger`'s knowledge of the current frame."""
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
        for callback in self.next_breakpoint_callbacks:
            callback()
        self.next_breakpoint_callbacks.clear()

    # ==================================================================================================================
    # Control flow callback functions.
    # --------------------------------
    # These callback functions manipulate the control flow of the program at the behest of the server. With the
    # exception of callback_stop, each takes a single argument, which is a function of the form (context, namespace)
    # => None. The function should be executed after the program has halted again, with the context object and
    # namespace dict being generated at that time. See _get_context and get_namespace for information about those
    # objects.
    # ==================================================================================================================

    def callback_stop(self, callback_fn):
        """Stops execution of the program immediately.

        Args:
            callback_fn (fn): A 0-argument function from the server to be executed before the program terminates.
        """
        self.keep_waiting = False
        callback_fn()
        self.set_quit()

    def callback_step_into(self, callback_fn):
        """Steps forward one line of code, stepping down into functions if encountered."""
        self.keep_waiting = False
        self.set_step()
        self.next_breakpoint_callbacks.append(self._server_command_callback_wrapper(callback_fn))

    def callback_step_over(self, callback_fn):
        """Steps forward one line of code, stepping over functions if encountered."""
        self.keep_waiting = False
        self.set_next(self.current_frame)
        self.next_breakpoint_callbacks.append(self._server_command_callback_wrapper(callback_fn))

    def callback_step_out(self, callback_fn):
        """Continues execution until the program returns from its current frame."""
        self.keep_waiting = False
        self.set_return(self.current_frame)
        self.next_breakpoint_callbacks.append(self._server_command_callback_wrapper(callback_fn))

    def callback_continue(self, callback_fn):
        """Continues execution until a breakpoint (which must be defined beforehand) is hit."""
        self.keep_waiting = False
        self.set_continue()
        self.next_breakpoint_callbacks.append(self._server_command_callback_wrapper(callback_fn))

    def _server_command_callback_wrapper(self, callback_fn):
        """Wraps a callback function which expects a debugger context and a namespace as a 0-argument function.

        When the server asks the debugger to update the runtime (via a step or continue), it sends a callback to be
        executed after the debugger has stopped again. This callback takes two arguments: a context object (which
        represents the state of the runtime, including file and line number) and a namespace object (which associates
        symbol IDs with shell dictionaries describing them). These functions are not executed until the next
        breakpoint, at which point every enqueued callback is run. All of these callbacks must have 0 arguments (for
        generality), so we create a 0-argument version of the runtime update callback here.
        """
        def _callback():
            context = self.viz_engine.to_json(self._get_context())
            namespace = self.viz_engine.to_json(self._get_namespace_shells())
            callback_fn(context, namespace)
        return _callback

    # ==================================================================================================================
    # Data transmission callback functions.
    # -------------------------------------
    # These functions return a piece of information requested by the server.
    # ==================================================================================================================

    def callback_get_namespace_shells(self, callback_fn):
        """Gets the lightweight shell representations of all symbols in the program's current namespace.

        The server might at any time request the shells of all objects in the namespace (for example, when a new
        client connects, it would make this request). This function is called when such a request is made.

        Args:
            callback_fn (fn): A (str) => None function from the server which expects the JSON string representation
                of the dict mapping symbol IDs to shells for each symbol in the namespace.
        """
        callback_fn(self.viz_engine.to_json(self._get_namespace_shells()))

    def callback_get_context(self, callback_fn):
        """Gets a string representation of the program's current state of execution.

        The server might at any time request the status of the program, such as line number (all newly-connecting
        clients would need this information). This function is called when such a request is made.

        Args:
            callback_fn (fn): A (str) => None function from the server which expects the string representation
                of the program's current context object.
        """
        callback_fn(self._get_context())

    def callback_load_symbol(self, symbol_id, callback_fn):
        """Load a symbol's data object and pass it into the given callback.

        When the server asks to load a symbol's data object, it sends the symbol ID and a callback function
        (which relays the loaded symbol to the client). The `VisualDebugger` loads the symbol and then calls the
        callback. Responding to this request should not cause the `VisualDebugger` to stop reading from the socket.

        Args:
            symbol_id (str): A string representing the unique ID of a Python object in the program.
            callback_fn (fn): A (str, str) => None function which accepts a JSON string of the requested symbol's
                data object and the JSON string mapping any symbols referenced by the data object to their shells.
        """
        callback_fn(*self._load_symbol(symbol_id))

    def _get_context(self):
        """Returns some object, for now a string, capturing the state of the program.

        The client will need to show users where the program has stopped, and some context information is required.
        This information is sent as part of a typical callback after program flow was manipulated at the server's
        request.

        Returns:
            (str): The file and line number of the Python program's current line.
        """
        # TODO send more information than just the filename and linenumber, like time spent running
        return self.format_stack_entry(self.current_stack[self.current_stack_index])

    def _get_namespace_shells(self):
        """Returns a dict mapping string symbol IDs to dict shell representations.

        Every variable in both the local and global namespaces is included. See `VisualizationEngine` for more
        information about the shell representation format. This function is typically called as part of a callback when
        the program stops at a new frame.

        Returns:
            (dict): Shells for all symbols in the namespace.
        """
        joined_namespace = dict(self.current_frame.f_globals)
        joined_namespace.update(self.current_frame.f_locals)
        return self.viz_engine.get_namespace_shells(joined_namespace)

    def _load_symbol(self, symbol_id):
        """Loads and returns the JSON representation of a requested symbol.

        Args:
            symbol_id (str): The name of the requested symbol.

        Returns:
            (str): A JSON-style representation of the symbol.
        """
        # The actual work of visualization is done by the `VisualizationEngine` instance owned by the `VisualDebugger`.
        symbol_data, new_shells = self.viz_engine.get_symbol_data(symbol_id)
        return self.viz_engine.to_json(symbol_data), self.viz_engine.to_json(new_shells)

    # ==================================================================================================================
    # `bdb` overrides.
    # ----------------
    # `bdb` is a cruel mistress and forces us to override these functions, which are called throughout
    # program flow. These functions allow us to interject our own logic at breakpoints, letting us start
    # communicating with the server again to figure out what to do next. Implementation and invocation
    # info is taken from `pdb`. `pdb` also also skips over any of these calls when the code is not from the main Python
    # file; when we implement `run()`, TODO: we will likely need to add support for this.
    # ==================================================================================================================

    def user_call(self, frame, argument_list):
        """Invoked when a function is called. Waits for server requests if the debugger should stop.

        `bdb` calls this function whenever a funciton is encountered in program flow where a breakpoint might
        possibly be. We should only stop if `bdb` tells us we should, via the stop_here function.
        """
        if self.stop_here(frame):
            self.setup_at_break(frame)
            self._wait_for_request()

    def user_exception(self, frame, exc_info):
        """Invoked when an exception occurs at or just below the debugger at a place where the debugger should stop.

        TODO: This one I know less about; however, we should probably stop normal program flow and put the debugger in
        control in the event of an exception.
        """
        # Taken from pdb; unsure how important this is. TODO look into this more
        exc_type, exc_value, exc_traceback = exc_info
        frame.f_locals['__exception__'] = exc_type, exc_value
        self.setup_at_break(frame)
        self._wait_for_request()

    def user_line(self, frame):
        """Invoked when the debugger stops or breaks on a line. Waits for a request from the server.

        Any line where the debugger should stop, including after a `step_[into, over]`, invokes this call, and we should
        pause execution accordingly. This does not trigger at the end of a function; instead, `user_return()` does.
        """
        self.setup_at_break(frame)
        self._wait_for_request()

    def user_return(self, frame, return_value):
        """Invoked when execution halts (because of a breakpoint) on a function return.
        """
        self.setup_at_break(frame)
        self._wait_for_request()

    def do_clear(self, arg):
        """Clears breakpoints specified by `arg`.

        A required implementation of `bdb`, used at least when a temporary breakpoint is hit.
        TODO: This is a strange function, and its purpose is unclear; we should figure it out at some point.

        Args:
            arg (None): An optional argument specifying which breakpoints to clear, but not used here.
        """
        # TODO implement deletions of breakpoints at specific lines.
        self.clear_all_breaks()

    def _wait_for_request(self):
        """Waits for a request from the server, looping if the callback is not terminal.

        Calling this function waits for at least one request on the socket. By default,
        the loop breaks after the first callback is completed, but callbacks can optionally request to keep the loop
        going.
        """
        # We enter the loop at least once, but will break out if keep_waiting is not set to True in the request
        # callback.
        self.keep_waiting = True
        while self.keep_waiting and not self.quitting:
            self.socket.wait(one_callback=True)


# ======================================================================================================================
# User-program-invoked debugging function.
# ======================================================================================================================

def set_trace():
    """A convenience function which instantiates a `VisualDebugger` object and sets trace at the current frame.

    This mimics the function of the same name in `pdb`, allowing users to just change `pdb` to `viz.debug` and
    run their code as normal. Crowding the runtime with multiple `VisualDebugger` objects is not terribly
    problematic, as at most one debugging server is created in each run.
    """
    VisualDebugger().set_trace(sys._getframe().f_back)

