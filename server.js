//requires
const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const port = process.env.PORT || 3000;

// express routing
app.use(express.static('public'));


// signaling
io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('create or join', function (roomNumber) {
        console.log(`create or join to room ${roomNumber}}`);
        var myRoom = ['', { size: 0 }];
        for (let value of socket.adapter.rooms) {
            if (value[0] === roomNumber) {
                myRoom = value
            }
        }
        var numClients = myRoom[1].size;

        console.log(roomNumber, ' has ', numClients, ' clients');

        if (numClients == 0) {
            socket.join(roomNumber);
            socket.emit('created', roomNumber);
        } else if (numClients < 4) {
            socket.join(roomNumber);
            socket.emit('joined', roomNumber);
        } else {
            socket.emit('full', roomNumber);
        }
    });

    socket.on('ready', function (room){
        socket.broadcast.to(room).emit('ready');
    });

    socket.on('candidate', function (event){
        socket.broadcast.to(event.room).emit('candidate', event);
    });

    socket.on('offer', function(event){
        socket.broadcast.to(event.room).emit('offer',event.sdp);
    });

    socket.on('answer', function(event){
        socket.broadcast.to(event.room).emit('answer',event.sdp);
    });

});

// listener
http.listen(port || 3000, function () {
    console.log('listening on', port);
});