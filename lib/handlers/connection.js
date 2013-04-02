var util            = require('util');
var EventEmitter    = require('events').EventEmitter;
var logger          = require('winstoon')('/lib/handlers/connection');

function ConnectionHandler(serverId, clients) {

	this.on('client', function(client) {

		var name;
		client.once('init', function(n) {
			name = n;
			clients[name] = client;
		});

		client.once('disconnect', function(name) {
			
			logger.info('disconnecting client:', name);

			client.removeListener('offer', onOffer);
			client.removeListener('answer', onAnswer);
			client.removeListener('ice-candidate', onIceCandidate);
			clients[name] = null;
		});

		client.on('offer', onOffer);
		client.on('answer', onAnswer);
		client.on('ice-candidate', onIceCandidate);

		function onOffer(to, desc) {

			logger.info('offer request', {from: name, to: to});
			var toClient = clients[to];
			if(toClient) {
				toClient.emit('offer', name, desc);
			} else {
				logger.warn('no such client to send offer', {from: name, to: to});
				client.emit('error', 'offer', {code: 'NO_CLIENT', to: to});
			}
		}

		function onAnswer(to, status, desc) {
			
			logger.info('answer request', {from: name, to: to});
			var toClient = clients[to];
			if(toClient) {
				toClient.emit('answer', name, status, desc);
			} else {
				logger.warn('no such client to send answer', {from: name, to: to});
				client.emit('error', 'answer', {code: 'NO_CLIENT', to: to});
			}
		}

		function onIceCandidate(to, candidate) {
			
			logger.debug('receiving ice-candidate request', {from: name, to: to});
			var toClient = clients[to];
			if(toClient) {
				toClient.emit('ice-candidate', name, candidate);
			} else {
				logger.warn('no such client to send ice-candidate', {from: name, to: to});
				client.emit('error', 'ice-candidate', {code: 'NO_CLIENT', to: to});
			}
		}

	});
}

util.inherits(ConnectionHandler, EventEmitter);

module.exports = ConnectionHandler;