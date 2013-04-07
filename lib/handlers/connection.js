var util            = require('util');
var EventEmitter    = require('events').EventEmitter;
var logger          = require('winstoon')('/lib/handlers/connection');
var metrics         = require('../metrics');

function ConnectionHandler(serverId, clients) {

    var count = 0;

    this.on('client', function(client) {

        var name;
        client.once('init', function(_name) {
            
            name = _name;
            clients[name] = client;
            count++;
        });

        client.once('disconnect', function() {
            
            logger.info('disconnecting client:', name);

            client.removeListener('offer', onOffer);
            client.removeListener('answer', onAnswer);
            client.removeListener('ice-candidate', onIceCandidate);
            clients[name] = null;
            count--;
        });

        client.on('offer', onOffer);
        client.on('answer', onAnswer);
        client.on('ice-candidate', onIceCandidate);

        function onOffer(resource, to, desc) {

            logger.info('offer request', {from: name, to: to, resource: resource});
            var toClient = clients[to];
            if(toClient) {
                toClient.emit('offer-' + resource, name, desc);
            } else {
                logger.warn('no such client to send offer', {from: name, to: to, resource: resource});
                client.emit('error-' + resource, 'offer', {code: 'NO_CLIENT', to: to, resource: resource});
            }
        }

        function onAnswer(resource, to, status, desc) {
            
            logger.info('answer request', {from: name, to: to, resource: resource});
            var toClient = clients[to];
            if(toClient) {
                toClient.emit('answer-' + resource, name, status, desc);
            } else {
                logger.warn('no such client to send answer', {from: name, to: to, resource: resource});
                client.emit('error-' + resource, 'answer', {code: 'NO_CLIENT', to: to, resource: resource});
            }
        }

        function onIceCandidate(resource, to, candidate) {
            
            logger.debug('receiving ice-candidate request', {from: name, to: to, resource: resource});
            var toClient = clients[to];
            if(toClient) {
                toClient.emit('ice-candidate-' + resource, name, candidate);
            } else {
                logger.warn('no such client to send ice-candidate', {from: name, to: to, resource: resource});
                client.emit('error-' + resource, 'ice-candidate', {code: 'NO_CLIENT', to: to, resource: resource});
            }
        }

    });

    //adding metric for peer/connection count
    metrics.trackAtSend('peers', function() {
        return count;
    });
}   

util.inherits(ConnectionHandler, EventEmitter);

module.exports = ConnectionHandler;