var util            = require('util');
var EventEmitter    = require('events').EventEmitter;

function DirectoryHandler(model) {

    var self = this;

    this.on('init', function(peerId, totalInterested, existingPeerList, interestedResources) {

    });

    this.on('disconnect', function(peerId) {

    });

    this.on('connected-with', function(peerId, connectedWithPeer) {

    });

    this.on('disconnected-with', function(peerId, disconnectedWithPeer) {

    });

    this.on('request-peer', function(peerId, resource) {

        clientManager.emit('peer-selected', peerId, 'newPeerId');
    });
}

util.inherits(DirectoryHandler, EventEmitter);

module.exports = DirectoryHandler;