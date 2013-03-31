var util            = require('util');
var EventEmitter    = require('events').EventEmitter;
var logger          = require('winstoon')('/lib/handlers/connection');

function ConnectionHandler(serverId, clients) {

	this.on('client', function(client) {

		client.once('init', function(name) {
			clients[name] = client;
		});

		client.once('disconnect', function(name) {
			clients[name] = null;
		});
	});
}

util.inherits(ConnectionHandler, EventEmitter);

module.exports = ConnectionHandler;