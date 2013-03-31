var util            	= require('util');
var uuid 				= require('node-uuid');
var EventEmitter    	= require('events').EventEmitter;

var DirectoryHandler 	= require('./handlers/directory');
var ConnectionHandler 	= require('./handlers/connection');

function ClientManager(sockets, models) {

	var SERVER_ID = uuid.v4();
    var clients = {};

    var directoryHandler = new DirectoryHandler(SERVER_ID, clients, model.directory);
    var connectionHandler = new ConnectionHandler(SERVER_ID, clients);

    sockets.on('connection', function(socket) {

    	connectionHandler.emit('client', socket);
    	directoryHandler.emit('client', socket);
    });
}

util.inherits(ClientManager, EventEmitter);

module.exports = ClientManager;