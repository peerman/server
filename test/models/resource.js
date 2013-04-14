var ResourceModel   = require('../../lib/models/resource');
var mongo           = require('mongodb');
var assert          = require('assert'); 

var $ = require('qbox').create();

mongo.MongoClient.connect('mongodb://localhost/_peerman', function(err, db) {

    if(err) throw err;
    $.db = db;
    $.start();
});

var COLLECTION = 'resource';

suite('ResourceModel', function() {

    test('.create() and .retrieve()', _clean(function(coll, done) {

        var id = 'sdsdsdw';
        var owner = 'kamal';

        var rm = new ResourceModel(coll);
        rm.create(id, owner, null, function(err) {

            assert.ifError(err);
            rm.retrieve(id, validateResult);
        });

        function validateResult(err, resource) {

            assert.ifError(err);
            assert.deepEqual(resource, {
                id: id,
                owner: owner,
                metadata: {}
            });
            done();
        }
    }));

    test('.remove()', _clean(function(coll, done) {

        var id = 'sdsdinudy';
        var owner = 'kamal';

        var rm = new ResourceModel(coll);
        rm.create(id, owner, null, function(err) {

            assert.ifError(err);
            rm.remove(id, doRetrieveAgain);
        });

        function doRetrieveAgain(err) {
            
            assert.ifError(err);
            rm.retrieve(id, validateState);
        }

        function validateState (err, resource) {
            
            assert.ifError(err);
            assert.equal(resource, null);
            done();
        }
    }));

    test('.setMetadata() and getAllMetadata()', _clean(function(coll, done) {

        var id = 'sdsdsdw';
        var owner = 'kamal';

        var rm = new ResourceModel(coll);
        rm.create(id, owner, {a: 10}, function(err) {

            assert.ifError(err);
            rm.setMetadata(id, {b: 11, c: 12}, doValidateState);
        });

        function doValidateState(err) {

            assert.ifError(err);
            rm.getAllMetadata(id, validateResult);
        }

        function validateResult(err, metadata) {
            
            assert.ifError(err);
            assert.deepEqual(metadata, {
                a: 10, 
                b: 11,
                c: 12
            });
            done();
        }
    }));

    test('.getMetadata()', _clean(function(coll, done) {

        var id = 'sdsdsdw';
        var owner = 'kamal';

        var rm = new ResourceModel(coll);
        rm.create(id, owner, {a: 10}, function(err) {

            assert.ifError(err);
            rm.setMetadata(id, {b: 11, c: 12}, doValidateState);
        });

        function doValidateState(err) {

            assert.ifError(err);
            rm.getMetadata(id, ['a', 'c'], validateResult);
        }

        function validateResult(err, metadata) {
            
            assert.ifError(err);
            assert.deepEqual(metadata, {
                a: 10, 
                c: 12
            });
            done();
        }
    }));

    test('.removeMetadata()', _clean(function(coll, done) {

        var id = 'sdsdsdw';
        var owner = 'kamal';

        var rm = new ResourceModel(coll);
        rm.create(id, owner, {a: 10, d: 12, c: 45}, function(err) {

            assert.ifError(err);
            rm.removeMetadata(id, ['a', 'c'], doValidateState);
        });

        function doValidateState(err) {

            assert.ifError(err);
            rm.getAllMetadata(id, validateResult);
        }

        function validateResult(err, metadata) {
            
            assert.ifError(err);
            assert.deepEqual(metadata, {
                d: 12
            });
            done();
        }
    }));

    test('.isOwner() - success', _clean(function(coll, done) {

        var id = 'sdsdsdw';
        var owner = 'kamal';

        var rm = new ResourceModel(coll);
        rm.create(id, owner, null, function(err) {

            assert.ifError(err);
            rm.isOwner(id, owner, validateResult);
        });

        function validateResult(err, isOwner) {

            assert.ifError(err);
            assert.equal(isOwner, true);
            done();
        }
    }));

    test('.isOwner() - failed', _clean(function(coll, done) {

        var id = 'sdsdsdw';
        var owner = 'kamal';

        var rm = new ResourceModel(coll);
        rm.isOwner(id, owner, validateResult);

        function validateResult(err, isOwner) {

            assert.ifError(err);
            assert.equal(isOwner, false);
            done();
        }
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