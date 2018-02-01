"use strict";

/**
 * This file defines the main server program. The server receives API requests from the client over HTTP, which it
 * services by communicating with the Python debugger over socketIO.
 *
 * The server is invoked through: node server.js (program-port) (client-port)
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

// =====================================================================================================================

/**
 * GET /
 * Does nothing except send an acknowledge message.
 */
app.get("/", function(req, resp) {
    resp.send("Hello, from the Xnode debugging server!");
});

/**
 * GET /debug/continue"
 * Triggers the debugger to CONTINUE.
 */
app.get("/debug/continue", function(req, resp) {
    resp.send("Trigger CONTINUE.");
});

/**
 * GET /debug/continue"
 * Triggers the debugger to CONTINUE.
 */
app.get("/debug/step_over", function(req, resp) {
    resp.send("Trigger STEP OVER.");
});

/**
 * GET /debug/continue"
 * Triggers the debugger to CONTINUE.
 */
app.get("/debug/step_in", function(req, resp) {
    resp.send("Trigger STEP IN.");
});

/**
 * GET /debug/continue"
 * Triggers the debugger to CONTINUE.
 */
app.get("/debug/step_out", function(req, resp) {
    resp.send("Trigger STEP OUT.");
});

/**
 * GET /debug/continue"
 * Triggers the debugger to CONTINUE.
 */
app.get("/debug/load_symbol/:symbol_id", function(req, resp) {
    if(programSocket === null) {
        console.error("Tried to load symbol but not connected to program.");
        return;
    }

    var symbol_id = req.params.symbol_id;
    programSocket.emit("dbg-load-symbol", symbol_id, function(schema) {
        console.log("Loaded symbol via callback: " + schema);
        resp.send("Loaded symbol via callback: " + schema);
    });


});

/**
 * POST /debug/continue"
 * Triggers the debugger to CONTINUE.
 */
app.post("/debug/set_symbol/:symbol_id", function(req, resp) {
    var symbol_id = req.params.symbol_id;
    resp.send("Load symbol: " + symbol_id + ".");
});

/**
 * GET /debug/continue"
 * Triggers the debugger to CONTINUE.
 */
app.get("/debug/stop", function(req, resp) {
    resp.send("Pressed STOP.");
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

    // Set data handler
    socket.on("disconnect", function(){
        programSocket = null;
        console.log("Disconnected from debugging program.");
    });
});

// =====================================================================================================================
// Begin server operation.
// =====================================================================================================================

server.listen(CLIENT_PORT);