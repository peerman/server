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
        client.on('is-resource-owner', onIsResourceOwner);
        client.once('disconnect', onDisconnect);

        function onInit(n, token) {
            
            name = n;
            loginToken = token;
            userId = null;

            logger.info('initializing client for authenticatation', {name: name, token: loginToken});

            if(loginToken) {
                checkLogin(loginToken, function(err, _userId) {

                    if(err) {
                        logger.info('error login', {error: err.message});
                        client.emit('authenticated', false);
                    } else {
                        client.emit('authenticated', true);
                        userId = _userId;
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
                resourceModel.isOwner(id, userId, afterAuthorized);
            } else {
                client.emit('remove-resource-' + id, 'AUTH_FAILED');
            }

            function afterAuthorized(err, authorized) {

                if(err) {
                    logger.error('error while authorization', {id: id, error: err.message});
                    client.emit('remove-resource-' + id, 'INTERNAL_ERROR');
                } else if(authorized) {
                    resourceModel.remove(id, afterResourceRemoved);
                } else {
                    client.emit('remove-resource-' + id, 'UNAUTHORIZED');
                }
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
                resourceModel.isOwner(id, userId, afterAuthorized);
            } else {
                client.emit('set-metadata-' + id, 'AUTH_FAILED');
            }

            function afterAuthorized(err, authorized) {

                if(err) {
                    logger.error('error while authorization', {id: id, error: err.message});
                    client.emit('set-metadata-' + id, 'INTERNAL_ERROR');
                } else if(authorized) {
                    resourceModel.setMetadata(id, kvPairs, afterSetMetadata);
                } else {
                    client.emit('set-metadata-' + id, 'UNAUTHORIZED');
                }
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
            
            logger.info('removing metadata', {id: id, keyList: keyList});
            if(userId) {
                resourceModel.isOwner(id, userId, afterAuthorized);
            } else {
                client.emit('remove-metadata-' + id, 'AUTH_FAILED');
            }

            function afterAuthorized(err, authorized) {

                if(err) {
                    logger.error('error while authorization', {id: id, error: err.message});
                    client.emit('remove-metadata-' + id, 'INTERNAL_ERROR');
                } else if(authorized) {
                    resourceModel.removeMetadata(id, keyList, afterMetadataRemoved);
                } else {
                    client.emit('remove-metadata-' + id, 'UNAUTHORIZED');
                }
            }

            function afterMetadataRemoved(err) {

                console.log('=============', arguments);
                
                if(err) {
                    logger.error('error removing metada', {id: id, keyList: keyList, error: err.metadata});
                    client.emit('remove-metadata-' + id, 'INTERNAL_ERROR');
                } else {
                    console.log('+++++++++++++ sending remove');
                    client.emit('remove-metadata-' + id);
                }
            }
        }

        function onIsResourceOwner(id) {

            logger.info('checking resource owner', {id: id, user: userId});

            if(userId) {
                resourceModel.isOwner(id, userId, afterAuthorized);
            } else {
                client.emit('is-resource-owner-' + id, false);
            }

            function afterAuthorized(err, authorized) {

                if(err) {
                    logger.error('error while authorization', {id: id, error: err.message});
                    client.emit('is-resource-owner-' + id, false);
                } else {
                    client.emit('is-resource-owner-' + id, authorized);
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
            client.removeListener('is-resource-owner', onRemoveMetadata);
            client.removeListener('init', onRemoveMetadata);
        }

    });
}

util.inherits(ResourceHandler, EventEmitter);

module.exports = ResourceHandler;