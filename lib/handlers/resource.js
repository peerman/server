var util            = require('util');
var EventEmitter    = require('events').EventEmitter;
var uuid            = require('node-uuid');
var logger          = require('winstoon')('/lib/handlers/connection');

function ResourceHandler(serverId, clients, resourceModel, userModel) {

    this.on('client', function(client) {

        var name;
        var userId;

        client.on('init', onInit);
        client.on('create-resource', onCreateResource);
        client.on('get-resource', onGetResource);
        client.on('remove-resource', onRemoveResource);
        client.on('set-metadata', onSetMetadata);
        client.on('get-metadata', onGetMetadata);
        client.on('get-all-metadata', onGetAllMetadata);
        client.on('remove-metadata', onRemoveMetadata);
        client.once('disconnect', onDisconnect);

        function onInit(n, token) {
            
            name = n;
            loginToken = token;

            logger.info('initializing client for authenticatation', {name: name, token: loginToken});

            if(loginToken) {
                checkLogin(loginToken, function(err, _userId) {

                    if(err) {
                        logger.info('error login', {error: err.message});
                        client.emit('authenticated', false);
                    } else {
                        userId = _userId;
                        client.emit('authenticated', true);
                    }
                });
            } else {
                client.emit('authenticated', false);
            }
        }

        function onCreateResource(metadata) {
            
            var resourceId;

            logger.info('creating resource');
            if(userId) {
                resourceId = uuid.v4();
                resourceModel.create(resourceId, userId, metadata, afterResourceCreated); 
            } else {
                client.emit('create-resource', 'AUTH_FAILED');
            }

            function afterResourceCreated(err) {
                
                if(err) {
                    logger.error('error creating resource', { error: err.message });
                    client.emit('create-resource', 'INTERNAL_ERROR');
                } else {
                    client.emit('create-resource', null, resourceId);
                }
            }
        }

        function onGetResource(id) {
            
            logger.info('getting resource', {id: id});
            resourceModel.retrieve(id, function(err, resource) {

                if(err) {
                    logger.error('error getting resource', {id: id, error: err.message});
                    client.emit('get-resource-' + id, 'INTERNAL_ERROR');
                } else {
                    client.emit('get-resource-' + id, null, resource);
                }
            });
        }

        function onRemoveResource(id) {
            
            logger.info('removing resource', {id: id});
            if(userId) {
                resourceModel.remove(id, afterResourceRemoved);
            } else {
                client.emit('remove-resource-' + id, 'AUTH_FAILED');
            }

            function afterResourceRemoved(err) {
                
                if(err) {
                    logger.error('error removing resource', {id: id, error: err.message});
                    client.emit('remove-resource-' + id, 'INTERNAL_ERROR');
                } else {
                    client.emit('remove-resource-' + id);
                }
            }
        }

        function onSetMetadata(id, kvPairs) {
            
            logger.info('setting metadata', {id: id, kvPairs: kvPairs});
            if(userId) {
                resourceModel.setMetadata(id, kvPairs, afterSetMetadata);
            } else {
                client.emit('set-metadata-' + id, 'AUTH_FAILED');
            }

            function afterSetMetadata(err) {

                if(err) {
                    logger.error('error setting metadata', {id: id, kvPairs: kvPairs, error: err.message});
                    client.emit('set-metadata-' + id, 'INTERNAL_ERROR');
                } else {
                    client.emit('set-metadata-' + id);
                }
            }
        }

        function onGetMetadata(id, keyList) {
            
            logger.info('getting metadata', {id: id, keyList: keyList});
            resourceModel.getMetadata(id, keyList, function(err, metadata) {

                if(err) {
                    logger.error('error getting metadata', {id: id, keyList: keyList, error: err.message});
                    client.emit('get-metadata-' + id, 'INTERNAL_ERROR');
                } else {
                    client.emit('get-metadata-' + id, null, metadata);
                }
            });
        }

        function onGetAllMetadata(id) {
            
            logger.info('getting all metadata', {id: id});
            resourceModel.getAllMetadata(id, function(err, metadata) {

                if(err) {
                    logger.error('error getting all metadata', {id: id, error: err.message});
                    client.emit('get-all-metadata-' + id, 'INTERNAL_ERROR');
                } else {   
                    client.emit('get-all-metadata-' + id, null, metadata);
                }
            });
        }

        function onRemoveMetadata (id, keyList) {
            
            if(userId) {
                resourceModel.removeMetadata(id, keyList, afterMetadataRemoved);
            } else {
                client.emit('remove-metadata-' + id, 'AUTH_FAILED');
            }

            function afterMetadataRemoved(err) {
                
                if(err) {
                    logger.error('error removing metada', {id: id, keyList: keyList, error: err.metadata});
                    client.emit('get-all-metadata-' + id, 'INTERNAL_ERROR');
                } else {
                    client.emit('get-all-metadata-' + id);
                }
            }
        }

        function checkLogin(loginToken, callback) {

            if(loginToken) {
                userModel.checkLoginToken(loginToken, afterLoginChecked);
            } else {
                logger.warn('no login token');
                callback(new Error('NO_LOGIN_TOKEN'));
            }

            function afterLoginChecked(err, userId) {
                
                if(err) {
                    logger.error('error while checkLogin', { loginToken: loginToken, error: err.message });
                    callback(err);
                } else if(userId) {
                    callback(null, userId);
                } else {
                    logger.warn('login failed', { loginToken: loginToken });
                    callback(new Error('AUTH_FAILED'));
                }
            }
        }

        function onDisconnect(name) {
            
            client.removeListener('create-resource', onCreateResource);
            client.removeListener('get-resource', onGetResource);
            client.removeListener('remove-resource', onRemoveResource);
            client.removeListener('set-metadata', onSetMetadata);
            client.removeListener('get-metadata', onGetMetadata);
            client.removeListener('get-all-metadata', onGetAllMetadata);
            client.removeListener('remove-metadata', onRemoveMetadata);
            client.removeListener('init', onRemoveMetadata);
        }

    });
}

util.inherits(ResourceHandler, EventEmitter);

module.exports = ResourceHandler;