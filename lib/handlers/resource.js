var util            = require('util');
var EventEmitter    = require('events').EventEmitter;
var logger          = require('winstoon')('/lib/handlers/connection');

function ResourceHandler(serverId, clients, resourceModel, ownerModel) {

	this.on('client', function(client) {

		var name;
		var authToken;
		client.once('init', function(n, token) {
			name = n;
			authToken = token;
		});

		client.once('disconnect', function(name) {
			
			client.removeListener('create-resource', onCreateResource);
			client.removeListener('get-resource', onGetResource);
			client.removeListener('remove-resource', onRemoveResource);
			client.removeListener('set-metadata', onSetMetadata);
			client.removeListener('get-metadata', onGetMetadata);
			client.removeListener('get-all-metadata', onGetAllMetadata);
			client.removeListener('remove-metadata', onRemoveMetadata);
		});

		client.on('create-resource', onCreateResource);
		client.on('get-resource', onGetResource);
		client.on('remove-resource', onRemoveResource);
		client.on('set-metadata', onSetMetadata);
		client.on('get-metadata', onGetMetadata);
		client.on('get-all-metadata', onGetAllMetadata);
		client.on('remove-metadata', onRemoveMetadata);

		function onCreateResource(metadata) {
			//generate an uuid for id
			//choose the owner by logged in user or throw error
		}

		function onGetResource(id) {
			
		}

		function onRemoveResource(id) {
			//authentice this resource is owned by this user
		}

		function onSetMetadata(id, kvPairs) {
			//authentice this resource is owned by this user
		}

		function onGetMetadata(id, keyList) {
			
		}

		function onGetAllMetadata(id) {
			
		}

		function onRemoveMetadata (id, keyList) {
			//authentice this resource is owned by this user
		}

	});
}

util.inherits(ResourceHandler, EventEmitter);

module.exports = ResourceHandler;