"use strict";

/**
 * This file defines the main server program. The server receives requests from the client over HTTP, which it
 * services by communicating with the Python debugger over socketIO.
 *
 * The server is spun up by the first call to `set_trace` in debugging program, which invokes the command:
 *
 *     node server.js (program-port) (client-port)
 *
 * where program-port (optional) is the port used for communication between the server and the Python debugger program,
 * and client-port (optional) is the port used for request handling from clients (e.g. browsers).
 *
 * Since the server is spun up as a child process of the Python program being debugged, once the program exits the
 * server will die.
 *
 * Notes:
 *     The server can be configured in the future to use HTTPS as such:
 *     https://stackoverflow.com/questions/11744975/enabling-https-on-express-js
 */

let express  = require("express");   // Web app framework
let fs       = require("fs");        // Filesystem IO
let path     = require("path");      // Filesystem paths
let http     = require("http");      // Serving over http protocol
let async    = require("async");     // Asynchronous operations
let socketio = require("socket.io"); // Inter-process socket communication


// Communication channels
// ----------------------

/** The port on which this server communicates with the Python debugger program. Specified during invocation of node. */
const PROGRAM_PORT = process.argv[2] || 7000;

/** The port on which this server communicates with the client browser. Specified during invocation of node. */
const CLIENT_PORT = process.argv[3] || 8000;

/** The socket currently being used to communicate with the Python debugger program. There should only be one socket
 *  to communicate on at any time, because the server is driven by a single debugger. It is the job of the debugger
 *  program to open a socket connection to this server, and reopen the connection on failure. */
let programSocket = null;


// =====================================================================================================================
// Setup Express server with socket IO.
// =====================================================================================================================

// Create server to use HTTP with socket IO
let app = express();
let server = http.createServer(app);
let io = socketio(PROGRAM_PORT);

// =====================================================================================================================
// Frontend request handlers.
// =====================================================================================================================

// Set directory to serve files from
app.use(express.static(path.join(__dirname, "client/public")));

/**
 * GET /
 * Sends an acknowledgement string, so that a client can check whether the server is up and running.
 * TODO: Serve the React app from this URI.
 */
app.get("/info", function(req, resp) {
    resp.send(`Hello, from the Xnode debugging server!
               Using program port ${PROGRAM_PORT} and client port ${CLIENT_PORT}.`);
});

// =====================================================================================================================
// API request handlers.
// =====================================================================================================================

let routerAPI = express.Router();
app.use("/api", routerAPI);

// API - Debugging request handlers.
// ---------------------------------

let routerAPIDebug = express.Router();
routerAPI.use("/debug", routerAPIDebug);

/**
 * GET /api/debug/continue
 * Triggers the debugger to CONTINUE (resumes execution until the next breakpoint is reached).
 * Sends the client the current namespace variable data.
 */
routerAPIDebug.get("/continue", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to CONTINUE but not connected to program.");
        resp.sendStatus(503);  // "Service Unavailable"
        return;
    }

    programSocket.emit("dbg-continue", function(context, namespace) {
        resp.send(namespace);
        console.log("Sent namespace variable data after CONTINUE.");
    });
});

/**
 * GET /api/debug/stop"
 * Triggers the debugger to STOP (terminate execution of the program).
 * Sends the client an acknowledgement message.
 */
routerAPIDebug.get("/stop", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to STOP but not connected to program.");
        resp.sendStatus(503);  // "Service Unavailable"
        return;
    }

    programSocket.emit("dbg-stop", function() {
        resp.send("Program execution terminated.");
        console.log("Sent acknowledgement message for STOP.");
    });
});

/**
 * GET /api/debug/step_over
 * Triggers the debugger to STEP OVER (execute one line of code without entering a function call).
 * Sends the client the current namespace variable data.
 */
routerAPIDebug.get("/step_over", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to STEP OVER but not connected to program.");
        resp.sendStatus(503);  // "Service Unavailable"
        return;
    }

    programSocket.emit("dbg-step-over", function(context, namespace) {
        resp.send(namespace);
        console.log("Sent namespace variable data after STEP OVER.");
    });
});

/**
 * GET /api/debug/step_into
 * Triggers the debugger to STEP INTO (execute one line of code and enter a function call if appropriate).
 * Sends the client the current namespace variable data.
 */
routerAPIDebug.get("/step_into", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to STEP INTO but not connected to program.");
        resp.sendStatus(503);  // "Service Unavailable"
        return;
    }

    programSocket.emit("dbg-step-into", function(context, namespace) {
        resp.send(namespace);
        console.log("Sent namespace variable data after STEP INTO.");
    });
});

/**
 * GET /api/debug/step_out
 * Triggers the debugger to STEP OUT (resumes execution until right after the current function has returned).
 * Sends the client the current namespace variable data.
 */
routerAPIDebug.get("/step_out", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to STEP OUT but not connected to program.");
        resp.sendStatus(503);  // "Service Unavailable"
        return;
    }

    programSocket.emit("dbg-step-out", function(context, namespace) {
        resp.send(namespace);
        console.log("Sent namespace variable data after STEP OUT.");
    });
});

/**
 * GET /api/debug/get_namespace
 * Triggers the debugger to GET NAMESPACE, returning shells for all variables in the program namespace.
 * Sends the client the current namespace variable data.
 */
routerAPIDebug.get("/get_namespace", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to GET NAMESPACE but not connected to program.");
        resp.sendStatus(503);  // "Service Unavailable"
        return;
    }

    programSocket.emit("dbg-get-namespace", function(context, namespace) {
        resp.send(namespace);
        console.log("Sent namespace variable data after GET NAMESPACE.");
    });
});

/**
 * GET /api/debug/load_symbol/:symbol_id
 * Triggers the debugger to LOAD SYMBOL using the specified symbol ID.
 * Sends the client the symbol's current data.
 */
routerAPIDebug.get("/load_symbol/:symbol_id", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to LOAD SYMBOL but not connected to program.");
        resp.sendStatus(503);  // "Service Unavailable"
        return;
    }

    var symbol_id = req.params.symbol_id;
    programSocket.emit("dbg-load-symbol", symbol_id, function(symbol_data, new_shells) {
        resp.send(symbol_data);
        console.log("Sent symbol \"" + symbol_id + "\" data for LOAD SYMBOL.");
    });
});

/**
 * POST /api/debug/set_symbol/:symbol_id
 * Triggers the debugger to SET SYMBOL using the specified symbol ID.
 */
routerAPIDebug.post("/set_symbol/:symbol_id", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to SET SYMBOL but not connected to program.");
        resp.sendStatus(503);  // "Service Unavailable"
        return;
    }

    var symbol_id = req.params.symbol_id;
    resp.sendStatus(501);  // "Not Implemented"
    // TODO: Add set symbol functionality
});


// =====================================================================================================================
// IO communication handlers.
// =====================================================================================================================

io.on("connection", function(socket) {
    if(programSocket !== null) {
        console.error("Tried to establish another program connection while already connected.");
        return;
    }
    programSocket = socket;
    console.log(`Connected to debugging program on port ${PROGRAM_PORT}`);

    // Set disconnect handler.
    socket.on("disconnect", function(){
        programSocket = null;
        console.log("Disconnected from debugging program.");
    });
});


// =====================================================================================================================
// Begin server operation.
// =====================================================================================================================

server.listen(CLIENT_PORT);