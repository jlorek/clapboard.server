(function () {
    "use strict";
    // http://fdietz.github.io/2015/04/16/day-4-how-to-build-your-own-team-chat-in-five-days-expressjs-socket-io-and-angularjs-component-based-design-patterns.html
    var config = require('./config');
    var express = require('express');
    var bodyParser = require('body-parser');
    var http = require('http').Server(app);
    var io = require('socket.io')(http);

    var app = express();

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: true }));

    // development only
    //if ('development' == app.get('env')) {
    //app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    //}

    var port = process.env.PORT || 8080;

    // socket.io stuff
    io.on('connection', function (socket) {
        console.log('user connected with ID ' + socket.client.id);

        socket.on('add-data', function (message) {
            console.log('add-data: ' + JSON.stringify(message));
            io.emit('data', message);

            if (socket.board) {
                io.to(socket.board).emit('data', message);
            }
        });

        socket.on("create", function (message, callback) {
            // leave room if already joined
            if (socket.board) {
                socket.leave(socket.board);
            }

            var id = makeid();
            socket.join(id);
            socket.board = id;
            // socket.emit("create-success", { board: id });
            callback({success: true, id: id});
        });

        socket.on("join", function (message, callback) {
            // leave room if already joined
            if (socket.board) {
                socket.leave(socket.board);
            }

            socket.join(message.id);
            socket.board = message.id;
            io.to(socket.board).emit("new-user joined ", {id: socket.client.id});
            // send vs. emit?
            // send sends a message event
            // socket.emit("join-success");
            callback({success: true});
        });
    });

    // ROUTES FOR OUR API
    // =============================================================================
    var router = express.Router();              // get an instance of the express Router

    // enable CORS
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    // test route to make sure everything is working (accessed at GET http://localhost:8080/api)
    router.get('*', function (req, res) {
        res.json({ message: 'Welcome to Clipboard.API' });
    });

    // REGISTER OUR ROUTES -------------------------------
    // all of our routes will be prefixed with /api
    app.use('/api', router);

    // START THE SERVER
    // =============================================================================
    // app.listen(port);
    http.listen(port, function () {
        console.log('clipboard service up and running on port ' + port);
    });

    function makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
})();