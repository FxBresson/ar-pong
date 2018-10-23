// Imports ====================
var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http')
var https = require('https')

var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

var path = require('path');
var io = require('socket.io')(httpsServer, {secure: true});

// Basic server config ====================
app.use(express.static(path.join(__dirname, 'www')));
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'www/event.html'));
});


let sandboxes = {
    hiro: {
        id: 'hiro',
        pattern: 'patt.hiro', 
        cubes: [
            {
                position: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                color: 0xff0000,
                alpha: 0.5,
                status: "show",
                _id: 0,
            },
            {
                position: {
                    x: 0,
                    y: 0,
                    z: 1
                },
                color: 0xff0000,
                alpha: 1,
                status: "show",
                _id: 1,
            },
            {
                position: {
                    x: 0,
                    y: 0,
                    z: 2
                },
                color: 0x00ff00,
                alpha: 1,
                status: "show",
                _id: 2,
            },
            {
                position: {
                    x: 1,
                    y: 0,
                    z: 0
                },
                color: 0xfffff,
                alpha: 1,
                status: "wireframe",
                _id: 3,
            },
            {
                position: {
                    x: 1,
                    y: 0,
                    z: 1
                },
                color: 0xfffff,
                alpha: 1,
                status: "wireframe",
                _id: 4,
            },
            {
                position: {
                    x: 1,
                    y: 0,
                    z: 2
                },
                color: 0xfffff,
                alpha: 1,
                status: "wireframe",
                _id: 5,
            },
            {
                position: {
                    x: 2,
                    y: 0,
                    z: 0
                },
                color: 0xfffff,
                alpha: 1,
                status: "hidding",
                _id: 6,
            },
            {
                position: {
                    x: 2,
                    y: 0,
                    z: 1
                },
                color: 0xfffff,
                alpha: 1,
                status: "hidding",
                _id: 7,
            },
            {
                position: {
                    x: 2,
                    y: 0,
                    z: 2
                },
                color: 0xfffff,
                alpha: 1,
                status: "hidding",
                _id: 8,
            }
        ]
    }
}


function updateCube(newProps) {
    let updatedCube = Object.assign({}, sandboxes.hiro.cubes[newProps._id], newProps);
    sandboxes.hiro.cubes[newProps._id] = updatedCube;
    console.log(updatedCube)
    io.emit('cube_update', updatedCube);
}


// Socket.io interactions ====================
io.on('connection', function(socket){
    // console.log('connected'+socket.id)

    socket.on('get_sandboxes', () => {
       io.emit('return_sandboxes', sandboxes) 
    })

    socket.on('cube_color', (newProps) => updateCube(newProps))
    socket.on('cube_remove', (newProps) => updateCube(newProps))
    socket.on('cube_add', (newProps) => updateCube(newProps))

});

// Server listen ====================
httpsServer.listen(8443, function(){
    console.log('secure server listening on *:8443');
});
