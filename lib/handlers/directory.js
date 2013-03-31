var util            = require('util');
var EventEmitter    = require('events').EventEmitter;
var logger          = require('winstoon')('/lib/handlers/directory');

function DirectoryHandler(serverId, clients, model) {

    var self = this;

    this.on('client', function(client) {

        var name;
        client.once('init', onInit);
        client.on('add-peer', onAddPeer);
        client.on('remove-peer', onRemovePeer);
        client.on('add-resource', onAddResource);
        client.on('remove-resource', onRemoveResource);
        client.on('request-peer', onRequestPeer);
        client.once('disconnect', onDisconnect);

        function onInit(myId, totalInterested, existingPeerList, interestedResources) {
           
            logger.info('initializing client', {
                client: myId, totalInterested: totalInterested,
                existingPeerList: existingPeerList,
                interestedResources: interestedResources
            });

            totalInterested = totalInterested || 5;
            existingPeerList = existingPeerList || [];
            interestedResources = interestedResources || [];

            name = myId;
            model.save(name, {
                online: true, 
                serverId: serverId,
                totalInterested: totalInterested, 
                stillNeeded: totalInterested - existingPeerList.length,
                peers: existingPeerList,
                resources: interestedResources
            }, afterPeerSaved);
        }

        function onAddPeer(peerId) {
           
           logger.info('connect with peer', {client: name, peer: peerId});
           model.addPeer(name, peerId, onModelError('onAddPeer'));
        }

        function onRemovePeer(peerId) {
            
            logger.info('disconnect with peer', {client: name, peer: peerId});
            model.removePeer(name, peerId, onModelError('onRemovePeer'));
        }

        function onAddResource(resource) {
            
            logger.info('adding resource', {client: name, resource: resource});
            model.addResource(name, resource, onModelError('onAddResource'));
        }

        function onRemoveResource(resource) {
            
            logger.info('removing resource', {client: name, resource: resource});
            model.removeResource(name, resource, onModelError('onRemoveResource'));
        }

        function onRequestPeer(resource) {
            
            logger.info('requesting peer', {client: name, resource: resource});
            model.findPeersFor(name, resource, serverId, 1, afterPeersFound);
        }

        function onDisconnect() {
            
            logger.info('disconnecting client', {client: name});

            client.removeListener('add-peer', onAddPeer);
            client.removeListener('remove-peer', onRemovePeer);
            client.removeListener('add-resource', onAddResource);
            client.removeListener('remove-resource', onRemoveResource);
            client.removeListener('request-peer', onRequestPeer);

            model.save(name, {online: false}, onModelError('onDisconnect'))
        }

        function afterPeersFound(err, peers) {
            
            if(err) {
                logger.error('error when finding peers', {client: name, error: err.message});
            } else {
                var client = clients[name];
                if(client) {
                    logger.info('peers found', {client: name, peers: peers})
                    client.emit('peers-found', peers[0]);
                } else {
                    logger.warn('clients not found to send peers', {client: name});
                }
            }
        }


        function afterPeerSaved(err) {
           
            if(err) {
                logger.error('error when saving clients', {client: name, error: err.message});
            } else {
                var client = clients[name];
                if(client) {
                    client.emit('init-success');
                } else {
                    logger.warn('clients not found to send peers', {client: name});
                }
            }
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