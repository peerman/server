var util            = require('util');
var EventEmitter    = require('events').EventEmitter;
var logger          = require('winstoon')('/lib/handlers/directory');
var metrics         = require('../metrics');

function DirectoryHandler(serverId, clients, model) {

    var self = this;
    var UPDATABLE_FIELDS = {
        'totalInterested': true,
        'stillNeeded': true,
        'peers': true,
        'resources': true
    };

    this.on('client', function(client) {

        var name;
        client.once('init', onInit);
        client.once('init-resource', onInitResource);
        client.on('add-peer', onAddPeer);
        client.on('update-fields', onUpdateFields);
        client.on('remove-peer', onRemovePeer);
        client.on('request-peers', onRequestPeers);
        client.once('disconnect', onDisconnect);

        function onInit(_name, loginToken) {

            name = _name;
            logger.info('initializing client', { client: name });
        }

        /*
            name - name/id of the peer.
            This is the same as defined in `init` event. 
            But used here because, when reconnecting global `name` variable migth be null
        */
        function onInitResource(name, resource, initInfo) {
           
            logger.info('initializing resource', { client: name, resource: resource, initInfo: initInfo});

            initInfo = initInfo || {};
            var totalInterested = initInfo.totalInterested || 5;
            var existingPeerList = initInfo.connectedPeers || [];

            model.save(name, resource, {
                online: true, 
                serverId: serverId,
                totalInterested: totalInterested, 
                stillNeeded: totalInterested - existingPeerList.length,
                peers: existingPeerList
            }, afterPeerSaved);

            //add conn-time metrics
            var connTime = Date.now() - initInfo.timestamp;
            metrics.trackMean('conn-time', connTime);

            function afterPeerSaved(err) {
           
                if(err) {
                    logger.error('error when saving clients', {client: name, error: err.message});
                } else {
                    var client = clients[name];
                    if(client) {
                        client.emit('init-success-' + resource);
                    } else {
                        logger.warn('clients not found to send peers', {client: name});
                    }
                }
            }
        }

        function onUpdateFields(resource, fields) {

            var selectedFields = [];
            for(var key in fields) {
                if(UPDATABLE_FIELDS[key]) {
                    selectedFields[key] = fields[key];
                }
            } 

            logger.info('updating filelds', {client: name, resource: resource, fields: fields});
            model.save(name, resource, selectedFields, onModelError('onUpdateFields'));
        }

        function onAddPeer(resource, peerId) {
           
           logger.info('adding peer', {client: name, resource: resource, peer: peerId});
           model.addPeer(name, resource, peerId, onModelError('onAddPeer'));
        }

        function onRemovePeer(resource, peerId) {
            
            logger.info('removing peer', {client: name, resource: resource, peer: peerId});
            model.removePeer(name, resource, peerId, onModelError('onRemovePeer'));
        }

        function onRequestPeers(resource, count) {
            
            logger.info('requesting peers', {client: name, resource: resource});
            model.findPeersFor(name, resource, serverId, count, afterPeersFound);

            function afterPeersFound(err, peers) {
                
                if(err) {
                    logger.error('error when finding peers', {client: name, error: err.message});
                } else {
                    var client = clients[name];
                    if(client) {
                        logger.info('peers found', {client: name, peers: peers})
                        client.emit('peers-found-' + resource, peers);
                    } else {
                        logger.warn('clients not found to send peers', {client: name});
                    }
                }
            }
        }

        function onDisconnect() {
            
            logger.info('disconnecting client', {client: name});

            client.removeListener('add-peer', onAddPeer);
            client.removeListener('remove-peer', onRemovePeer);
            client.removeListener('request-peers', onRequestPeers);
            client.removeListener('update-fields', onUpdateFields);

            model.save(name, null, {online: false}, onModelError('onDisconnect'))
        }

    });

    function onModelError(type) {
            
        return function(err) {
           
            if(err) {
                logger.error('dictionary model error', {type: type, error: err.message})
            }
        }
    }
}

util.inherits(DirectoryHandler, EventEmitter);

module.exports = DirectoryHandler;