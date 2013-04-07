var DirectoryModel  = require('../../lib/models/directory');
var mongo           = require('mongodb');
var assert          = require('assert'); 

var $ = require('qbox').create();

mongo.MongoClient.connect('mongodb://localhost/_peerman', function(err, db) {

    if(err) throw err;
    $.db = db;
    $.start();
});

var COLLECTION = 'directory';

suite('DirectoryModel', function() {

    test('.save()', _clean(function(coll, done) {

        var serverId = 'sdsds';
        var peers = ['ssd', 's4d'];
        var peerId = '2323';
        var resource = 'resource';

        var dm = new DirectoryModel(coll);
        dm.save(peerId, resource, { serverId: serverId, peers: peers}, function(err) {

            assert.ifError(err);
            coll.findOne({id: peerId, resource: resource}, validateMongoState);
        });

        function validateMongoState(err, obj) {

            assert.ifError(err);
            assert.equal(obj.id, peerId);
            assert.equal(obj.resource, resource);
            assert.deepEqual(obj.peers, peers);
            assert.deepEqual(obj.serverId, serverId);
            assert.ok(obj.rnd);
            done();
        }
    }));

    test('.save() - multi (resource as null)', _clean(function(coll, done) {

        var peerId = '2323';

        var dm = new DirectoryModel(coll);
        dm.save(peerId, 'r1', { online: true }, function(err) {

            dm.save(peerId, 'r2', { online: true }, afterSavedAll);
        });

        function afterSavedAll(err) {
            
            dm.save(peerId, null, { online: false }, doValidateMongoState);
        }

        function doValidateMongoState(err) {
            
            assert.ifError(err);
            coll.find({ id: peerId, online: false }).toArray(validateMongoState);
        }

        function validateMongoState(err, peers) {

            assert.ifError(err);
            assert.equal(peers.length, peers.length);
            done();
        }
    }));

    test('.addPeer()', _clean(function(coll, done) {

        var peerId = '1313';
        var resource = 'resource1';
        var peers = [];

        coll.insert({id: peerId, resource: resource, peers: peers, stillNeeded: 10}, function(err) {

            assert.ifError(err);
            var dm = new DirectoryModel(coll);
            dm.addPeer(peerId, resource, 'new', doValidateState);
        });

        function doValidateState (err) {
            
            assert.ifError(err);
            coll.findOne({id: peerId, resource: resource}, validateState);
        }

        function validateState (err, obj) {
            
            assert.ifError(err);
            assert.deepEqual(obj.peers, ['new']);
            assert.deepEqual(obj.stillNeeded, 9);
            done();
        }
    }));

    test('.removePeer()', _clean(function(coll, done) {

        var peerId = '1313';
        var peers = ['some-one'];
        var resource = 'resource1';

        coll.insert({id: peerId, resource: resource, peers: peers, stillNeeded: 4}, function(err) {

            assert.ifError(err);
            var dm = new DirectoryModel(coll);
            dm.removePeer(peerId, resource, 'some-one', doValidateState);
        });

        function doValidateState (err) {
            
            assert.ifError(err);
            coll.findOne({id: peerId, resource: resource}, validateState);
        }

        function validateState (err, obj) {
            
            assert.ifError(err);
            assert.deepEqual(obj.peers, []);
            assert.equal(obj.stillNeeded, 5);
            done();
        }
    }));

    test('.findPeersFor() - correctly find', _clean(function(coll, done) {

        var dm = new DirectoryModel(coll);
        coll.insert({
            id: 'peer5',
            peers: ['peer4', 'peer3'],
            resource: 'r1',
            serverId: 's1',
            online: true,
            stillNeeded: 10
        }, function (err) {
            
            assert.ifError(err);
            dm.findPeersFor('peer1', 'r1', 's1', 1, afterFound);
        });

        function afterFound (err, obj) {
            
            assert.ifError(err);
            assert.deepEqual(obj, ['peer5']);
            done();
        };
    }));

    test('.findPeersFor() - peer already connected', _clean(function(coll, done) {

        var dm = new DirectoryModel(coll);
        coll.insert({
            id: 'peer5',
            peers: ['peer1', 'peer3'],
            resources: 'r1',
            serverId: 's1',
            online: true,
            stillNeeded: 10
        }, function (err) {
            
            assert.ifError(err);
            dm.findPeersFor('peer1', 'r1', 's1', 1, afterFound);
        });

        function afterFound (err, obj) {
            
            assert.ifError(err);
            assert.deepEqual(obj, []);
            done();
        };
    }));

    test('.findPeersFor() - not the correct resources', _clean(function(coll, done) {

        var dm = new DirectoryModel(coll);
        coll.insert({
            id: 'peer5',
            peers: ['peer4', 'peer3'],
            resources: 'r1',
            serverId: 's1',
            online: true,
            stillNeeded: 10
        }, function (err) {
            
            assert.ifError(err);
            dm.findPeersFor('peer1', 'r5', 's1', 1, afterFound);
        });

        function afterFound (err, obj) {
            
            assert.ifError(err);
            assert.deepEqual(obj, []);
            done();
        };
    }));

    test('.findPeersFor() - invalid serverId', _clean(function(coll, done) {

        var dm = new DirectoryModel(coll);
        coll.insert({
            id: 'peer5',
            peers: ['peer4', 'peer3'],
            resources: 'r1',
            serverId: 's1',
            online: true,
            stillNeeded: 10
        }, function (err) {
            
            assert.ifError(err);
            dm.findPeersFor('peer1', 'r1', 's3', 1, afterFound);
        });

        function afterFound (err, obj) {
            
            assert.ifError(err);
            assert.deepEqual(obj, []);
            done();
        };
    }));

});

function _clean(callback) {

    return function(done) {

        $.ready(function() {

            $.db.collection(COLLECTION).remove(afterDropped);
        });

        function afterDropped(err) {

            if(err) throw err;
            callback($.db.collection(COLLECTION), done);
        }
    }
}