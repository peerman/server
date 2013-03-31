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
    this.save = function(peerId, peerObject, callback) {

        //random id for random selection
        peerObject.rnd = Math.random();
        var updateObject = {$set: peerObject};
        collection.update({_id: peerId}, updateObject, {upsert: true}, callback);
    };

    this.addPeer = function(peerId, newPeer, callback) {

        var updateObject = {$addToSet: {peers: newPeer}, $inc: {stillNeeded: -1}};
        collection.update({_id: peerId}, updateObject, {upsert: true}, callback);
    };

    this.removePeer = function(peerId, removingPeer, callback) {

        var updateObject = {$pull: {peers: removingPeer}, $inc: {stillNeeded: 1}};
        collection.update({_id: peerId}, updateObject, callback);
    };

    this.addResource = function(peerId, resource, callback) {

        var updateObject = {$addToSet: {resources: resource}};
        collection.update({_id: peerId}, updateObject, {upsert: true}, callback);
    };

    this.removeResource = function(peerId, resource, callback) {

        var updateObject = {$pull: {resources: resource}};
        collection.update({_id: peerId}, updateObject, callback);
    };

    /*
        Search Peers to connect
    */

    this.findPeersFor = function(peerId, resource, serverId, count, callback) { 

        var query = {
            peers: {$nin: [peerId]},
            resources: {$in: [resource]},
            serverId: serverId,
            online: true,
            stillNeeded: {$gt: 0}
        };

        collection.find(query).limit(count).sort({rnd: 1}).toArray(function(err, peerList) {

            if(err) {
                callback(err);
            } else {
                callback(null, peerList.map(function(o) {
                    return o._id;
                }));
            }
        });
    };
}

module.exports = DirectoryModel;