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

        var dm = new DirectoryModel(coll);
        dm.save(peerId, { serverId: serverId, peers: peers}, function(err) {

            assert.ifError(err);
            coll.findOne({_id: peerId}, validateMongoState);
        });

        function validateMongoState(err, obj) {

            assert.ifError(err);
            assert.deepEqual(obj, {
                _id: peerId,
                serverId: serverId,
                peers: peers
            });
            done();
        }
    }));

    test('.addPeer()', _clean(function(coll, done) {

        var peerId = '1313';
        var peers = [];

        coll.insert({_id: peerId, peers: peers, stillNeeded: 10}, function(err) {

            assert.ifError(err);
            var dm = new DirectoryModel(coll);
            dm.addPeer(peerId, 'new', doValidateState);
        });

        function doValidateState (err) {
            
            assert.ifError(err);
            coll.findOne({_id: peerId}, validateState);
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

        coll.insert({_id: peerId, peers: peers, stillNeeded: 4}, function(err) {

            assert.ifError(err);
            var dm = new DirectoryModel(coll);
            dm.removePeer(peerId, 'some-one', doValidateState);
        });

        function doValidateState (err) {
            
            assert.ifError(err);
            coll.findOne({_id: peerId}, validateState);
        }

        function validateState (err, obj) {
            
            assert.ifError(err);
            assert.deepEqual(obj.peers, []);
            assert.equal(obj.stillNeeded, 5);
            done();
        }
    }));

    test('.addResource()', _clean(function(coll, done) {

        var peerId = '1313';
        var resources = [];

        coll.insert({_id: peerId, resources: resources}, function(err) {

            assert.ifError(err);
            var dm = new DirectoryModel(coll);
            dm.addResource(peerId, 'new', doValidateState);
        });

        function doValidateState (err) {
            
            assert.ifError(err);
            coll.findOne({_id: peerId}, validateState);
        }

        function validateState (err, obj) {
            
            assert.ifError(err);
            assert.deepEqual(obj.resources, ['new']);
            done();
        }
    }));

    test('.removeResource()', _clean(function(coll, done) {

        var peerId = '1313';
        var resources = ['some-thing'];

        coll.insert({_id: peerId, resources: resources}, function(err) {

            assert.ifError(err);
            var dm = new DirectoryModel(coll);
            dm.removeResource(peerId, 'some-thing', doValidateState);
        });

        function doValidateState (err) {
            
            assert.ifError(err);
            coll.findOne({_id: peerId}, validateState);
        }

        function validateState (err, obj) {
            
            assert.ifError(err);
            assert.deepEqual(obj.resources, []);
            done();
        }
    }));

    test('.findPeersFor() - correctly find', _clean(function(coll, done) {

        var dm = new DirectoryModel(coll);
        coll.insert({
            _id: 'peer5',
            peers: ['peer4', 'peer3'],
            resources: ['r1', 'r2'],
            serverId: 's1'
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
            _id: 'peer5',
            peers: ['peer1', 'peer3'],
            resources: ['r1', 'r2'],
            serverId: 's1'
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
            _id: 'peer5',
            peers: ['peer4', 'peer3'],
            resources: ['r1', 'r2'],
            serverId: 's1'
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
            _id: 'peer5',
            peers: ['peer4', 'peer3'],
            resources: ['r1', 'r2'],
            serverId: 's1'
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

            $.db.collection(COLLECTION).drop(afterDropped);
        });

        function afterDropped(err) {

            if(err) throw err;
            callback($.db.collection(COLLECTION), done);
        }
    }
}