var util            	= require('util');
var uuid 				= require('node-uuid');
var EventEmitter    	= require('events').EventEmitter;

var DirectoryHandler 	= require('./handlers/directory');
var ConnectionHandler 	= require('./handlers/connection');
var ResourceHandler   = require('./handlers/resource');

function ClientManager(sockets, models) {

	if(!(this instanceof ClientManager)) {
		return new ClientManager(sockets, models);
	}

	var SERVER_ID = uuid.v4();
    var clients = {};

    var directoryHandler = new DirectoryHandler(SERVER_ID, clients, models.directory);
    var connectionHandler = new ConnectionHandler(SERVER_ID, clients);
    var resourceHandler = new ResourceHandler(SERVER_ID, clients, models.resource, models.access);

    sockets.on('connection', function(socket) {

    	connectionHandler.emit('client', socket);
    	directoryHandler.emit('client', socket);
        resourceHandler.emit('client', socket);
    });
}

util.inherits(ClientManager, EventEmitter);

module.exports = ClientManager;