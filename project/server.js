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

var colors = {
    white: 'hsl(0, 0%, 100%)',
    default: 'hsl(0, 75%, 65%)'
}

// Basic server config ====================
app.use(express.static(path.join(__dirname, 'www')));
app.get('/ar', function(req, res){
    res.sendFile(path.join(__dirname, 'www/app.html'));
});

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'www/landing.html'));
});


const gridSize = 5;

let sandboxes = {
    hiro: {
        id: 'hiro',
        pattern: 'patt.letterA',
        cubes: []
    }
}

var incrementalId = 0;

var midSize = Math.floor(gridSize/2);

for (var y = 0; y<=gridSize; y++) {
    for (var z = -midSize; z<=midSize; z++) {
        for (var x = -midSize; x<=midSize; x++) {

            var status = 'hidding';

            if ( (y === 0 || y === 1) && (x >= -1 && x<= 1 ) &&  (z >= -1 && z<= 1 ) ) {
                status = 'wireframe'
                if (x === 0 && y === 0 && z === 0) {
                    status = 'show'
                }
            }

            var center = (x === Math.floor(gridSize/2) && z === Math.floor(gridSize/2) && y === 0); 

            sandboxes.hiro.cubes.push({
                position: {
                    x: x,
                    y: y,
                    z: z
                },
                color: status === "wireframe" || status === "hidding" ? colors.white : colors.default,
                alpha: 1,
                status: status,
                _id: incrementalId++,
            })
        }
    }
}



function updateCube(newProps, socket) {
    let updatedCube = Object.assign({}, sandboxes.hiro.cubes[newProps._id], newProps);
    sandboxes.hiro.cubes[newProps._id] = updatedCube;
    if (updatedCube.status === "show" && updatedCube.color === colors.white) updatedCube.color = colors.default
    io.emit('cube_update', updatedCube, socket);
}


// Socket.io interactions ====================
io.on('connection', function(socket){

    socket.on('get_sandboxes', () => {
       io.emit('return_sandboxes', sandboxes)
    })

    socket.on('cube_color', (newProps) => updateCube(newProps))
    socket.on('cube_remove', (newProps) => updateCube(newProps))
    socket.on('cube_add', (newProps) => {
        updateCube(newProps, socket.id)

        let origin = sandboxes.hiro.cubes[newProps._id].position

        let cubes = sandboxes.hiro.cubes.filter(c => {
            return (c.position.y >= origin.y-1 && c.position.y<= origin.y+1) && (c.position.x >= origin.x-1 && c.position.x<= origin.x+1 ) &&  (c.position.z >= origin.z-1 && c.position.z<= origin.z+1 )
        });

        for (cubeToUpdate of cubes) {
            if (cubeToUpdate.status === 'hidding') {
                updateCube({
                    _id: cubeToUpdate._id,
                    status: 'wireframe'
                }, socket.id)
            }
        }
    })

});

// Server listen ====================
httpsServer.listen(8443, function(){
    console.log('secure server listening on *:8443');
});
