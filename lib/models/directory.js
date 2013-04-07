/*
    Possible Index: {
        id: true,
        resource: true
    }
*/
function DirectoryModel(collection) {

    if(!(this instanceof DirectoryModel)) {
        return new DirectoryModel(collection);
    }
    
    var self = this;

    /*
        Fileds will be used

            * online
            * totalInterested
            * stillNeeded
            * serverId
            * peers: []
            * resources: []

        This operation will set a new random id
    */
    this.save = function(peerId, resource, peerObject, callback) {

        //random id for random selection
        var query = { id: peerId };
        if(resource) {
            query['resource'] = resource;
        }

        peerObject.rnd = Math.random();
        var updateObject = {$set: peerObject};
        collection.update(query, updateObject, {upsert: true, multi: true}, callback);
    };

    this.addPeer = function(peerId, resource, newPeer, callback) {

        var query = { id: peerId, resource: resource};
        var updateObject = {$addToSet: {peers: newPeer}, $inc: {stillNeeded: -1}};
        collection.update(query, updateObject, {upsert: true}, callback);
    };

    this.removePeer = function(peerId, resource, removingPeer, callback) {

        var query = { id: peerId, resource: resource};
        var updateObject = {$pull: {peers: removingPeer}, $inc: {stillNeeded: 1}};
        collection.update(query, updateObject, callback);
    };

    /*
        Search Peers to connect
    */

    this.findPeersFor = function(peerId, resource, serverId, count, callback) { 

        var query = {
            id: {$nin: [peerId]},
            resource: resource,
            peers: {$nin: [peerId]},
            serverId: serverId,
            online: true,
            stillNeeded: {$gt: 0}
        };

        collection.find(query).limit(count).sort({rnd: 1}).toArray(function(err, peerList) {

            if(err) {
                callback(err);
            } else {
                callback(null, peerList.map(function(o) {
                    return o.id;
                }));
            }
        });
    };
}

module.exports = DirectoryModel;