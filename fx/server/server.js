// Imports ====================
var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);

// Basic server config ====================
app.use(express.static(path.join(__dirname, 'www')));
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'www/event.html'));
});

// Socket.io interactions ====================
io.on('connection', function(socket){
    // console.log('connected'+socket.id)

    // Catch a scaling event launched by a client
    socket.on('scale-up-local', function(entityName) {
        // Emit a scaling event to all clients
        io.emit('scale-up-server', entityName);
    })
});

// Server listen ====================
http.listen(3000, function(){
    console.log('listening on *:3000');
});
