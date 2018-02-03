"use strict";

/**
 * This file defines the main server program. The server receives API requests from the client over HTTP, which it
 * services by communicating with the Python debugger over socketIO.
 *
 * The server is spun up by the first call to `set_trace` in server, which invokes the command:
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

var express = require("express");  // Web app framework
var fs      = require("fs");       // Filesystem interaction
var http    = require("http");     // Communication over http
var async   = require("async");    // Asynchronous operations

// Communication channels
// ----------------------

/** The port on which this server communicates with the Python debugger program. Specified during invocation of node. */
const PROGRAM_PORT = process.argv[2] || 7000;

/** The port on which this server communicates with the client browser. Specified during invocation of node. */
const CLIENT_PORT = process.argv[3] || 8000;

/** The socket currently being used to communicate with the Python debugger program. There should only be one socket
 *  to communicate on at any time, because the server is driven by a single debugger. */
var programSocket = null;

// =====================================================================================================================
// Setup Express server with socket IO.
// =====================================================================================================================

// Create server to use HTTP with socket IO
var app = express();
var server = http.createServer(app);
var io = require("socket.io")(PROGRAM_PORT);

// Set directory to serve files from
app.use(express.static("./public"));


// =====================================================================================================================
// Client request handlers.
// =====================================================================================================================

/**
 * GET /
 * Sends an acknowledgement string, so that a client can check whether the server is up and running.
 */
app.get("/", function(req, resp) {
    resp.send("Hello, from the Xnode debugging server on port!");
});

/**
 * GET /debug/continue
 * Triggers the debugger to CONTINUE (resumes execution until the next breakpoint is reached).
 * Sends the client the current namespace variable data.
 */
app.get("/api/debug/continue", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to CONTINUE but not connected to program.");
        return;
    }

    programSocket.emit("dbg-continue", function(context, namespace) {
        resp.send(namespace);
        console.log("Sent namespace variable data after CONTINUE.");
    });
});

/**
 * GET /debug/continue"
 * Triggers the debugger to STOP (terminate execution of the program).
 * Sends the client an acknowledgement message.
 */
app.get("/api/debug/stop", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to STOP but not connected to program.");
        return;
    }

    programSocket.emit("dbg-stop", function() {
        resp.send("Program execution terminated.");
        console.log("Sent acknowledgement message for STOP.");
    });
});

/**
 * GET /debug/step_over
 * Triggers the debugger to STEP OVER (execute one line of code without entering a function call).
 * Sends the client the current namespace variable data.
 */
app.get("/debug/step_over", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to STEP OVER but not connected to program.");
        return;
    }

    programSocket.emit("dbg-step-over", function(context, namespace) {
        resp.send(namespace);
        console.log("Sent namespace variable data after STEP OVER.");
    });
});

/**
 * GET /debug/step_into
 * Triggers the debugger to STEP INTO (execute one line of code and enter a function call if appropriate).
 * Sends the client the current namespace variable data.
 */
app.get("/debug/step_into", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to STEP INTO but not connected to program.");
        return;
    }

    programSocket.emit("dbg-step-into", function(context, namespace) {
        resp.send(namespace);
        console.log("Sent namespace variable data after STEP INTO.");
    });
});

/**
 * GET /debug/step_out
 * Triggers the debugger to STEP OUT (resumes execution until right after the current function has returned).
 * Sends the client the current namespace variable data.
 */
app.get("/debug/step_out", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to STEP OUT but not connected to program.");
        return;
    }

    programSocket.emit("dbg-step-out", function(context, namespace) {
        resp.send(namespace);
        console.log("Sent namespace variable data after STEP OUT.");
    });
});

/**
 * GET /debug/load_symbol/:symbol_id
 * Triggers the debugger to LOAD SYMBOL using the specified symbol ID.
 * Sends the client the symbol's current data.
 */
app.get("/debug/load_symbol/:symbol_id", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to LOAD SYMBOL but not connected to program.");
        return;
    }

    var symbol_id = req.params.symbol_id;
    programSocket.emit("dbg-load-symbol", symbol_id, function(symbol) {
        resp.send(symbol);
        console.log("Sent symbol \"" + symbol_id + "\" data for LOAD SYMBOL.");
    });
});

/**
 * POST /debug/set_symbol/:symbol_id
 * Triggers the debugger to SET SYMBOL using the specified symbol ID.
 */
app.post("/debug/set_symbol/:symbol_id", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to SET SYMBOL but not connected to program.");
        return;
    }

    var symbol_id = req.params.symbol_id;
    resp.send("Not implemented.");
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
    console.log("Connected to debugging program.");

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