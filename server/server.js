"use strict";

/**
 * This file defines the main server program. The server receives API requests from the client over HTTP, which it
 * services by communicating with the Python debugger over socketIO.
 *
 * Notes:
 *     The server can be configured in the future to use HTTPS as such:
 *     https://stackoverflow.com/questions/11744975/enabling-https-on-express-js
 */
var express = require("express");  // Web app framework
var fs      = require("fs");       // Filesystem interaction
var http    = require("http");     // Communication over http
var async   = require("async");    // Asynchronous operations

// Create server to use HTTP with socket IO
var app = express();
var server = http.createServer(app);
var io = require("socket.io")(server);

// Set directory to serve files from
app.use(express.static("./public"));


// =====================================================================================================================
// Client request handlers.
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
    var symbol_id = req.params.symbol_id;
    resp.send("Load symbol: " + symbol_id + ".");
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
    console.log('Connection!');
    socket.emit('give-data');
    socket.on('sent-data', function(data) {
        console.log(data);
        if(data < 5){
            setTimeout(function(){
                socket.emit('give-data');
            }, 1000);
        } else {
            socket.emit('kill-signal', 'bye bye');
        }
    })
});

// =====================================================================================================================
// Begin server operation.
// =====================================================================================================================

server.listen(8080);