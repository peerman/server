var util            = require('util');
var EventEmitter    = require('events').EventEmitter;

function ClientManager(sockets, handlers) {

    var clients = {};

    handlers.directory.on('peer-selected', function(to, whom) {
        
    });
}

util.inherits(ClientManager, EventEmitter);

module.exports = ClientManager;