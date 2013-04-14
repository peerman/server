var UserModel       = require('../../lib/models/user');
var mongo           = require('mongodb');
var assert          = require('assert'); 

var $ = require('qbox').create();

mongo.MongoClient.connect('mongodb://localhost/_peerman', function(err, db) {

    if(err) throw err;
    $.db = db;
    $.start();
});

var COLLECTION = 'user';

suite('UserModel', function() {

    test('.create() and .authenticate() - successfully', _clean(function(coll, done) {

        var um = new UserModel(coll);
        um.create('user', 'pass', {}, function(err) {

            assert.ifError(err);
            um.authenticate('user', 'pass', afterAuthenticted);
        });

        function afterAuthenticted(err, authenticated) {

            assert.ifError(err);
            assert.equal(authenticated, true);
            done();
        }
    }));

    test('.create() and .authenticate() - failed', _clean(function(coll, done) {

        var um = new UserModel(coll);
        um.create('user', 'pass', {}, function(err) {

            assert.ifError(err);
            um.authenticate('user', 'unpass', afterAuthenticted);
        });

        function afterAuthenticted(err, authenticated) {

            assert.ifError(err);
            assert.equal(authenticated, false);
            done();
        }
    }));

    test('.create() user already exists', _clean(function(coll, done) {

        var um = new UserModel(coll);
        um.create('user', 'pass', {}, function(err) {

            assert.ifError(err);
            um.create('user', 'new-pass', {}, afterCreatedLater);
        });

        function afterCreatedLater(err) {
            
            assert.equal(err.message, 'USER_EXISTS');
            done();
        }
    }));

    test('.setLoginToken()', _clean(function(coll, done) {

        var token = 'token-here';
        var um = new UserModel(coll);
        um.create('user', 'pass', {}, function(err) {

            assert.ifError(err);
            um.setLoginToken('user', token, afterTokenSet);
        });

        function afterTokenSet(err) {

            assert.ifError(err);
            um.get('user', afterUserGot);
        }

        function afterUserGot(err, user) {

            assert.ifError(err);
            assert.equal(user.loginToken, token);
            done();
        }
    }));

    test('.checkLoginToken() - validated', _clean(function(coll, done) {

        var token = 'token-here';
        var um = new UserModel(coll);
        var user = 'user-here';
        um.create(user, 'pass', {}, function(err) {

            assert.ifError(err);
            um.setLoginToken(user, token, afterTokenSet);
        });

        function afterTokenSet(err) {

            assert.ifError(err);
            um.checkLoginToken(token, afterUserGot)
        }

        function afterUserGot(err, u) {

            assert.ifError(err);
            assert.equal(u, user);
            done();
        }
    }));

    test('.checkLoginToken() - not-validated', _clean(function(coll, done) {

        var token = 'token-here';
        var um = new UserModel(coll);
        var user = 'user-here';
        um.create(user, 'pass', {}, function(err) {

            assert.ifError(err);
            um.checkLoginToken(token, afterUserGot)
        });

        function afterUserGot(err, u) {

            assert.ifError(err);
            assert.equal(u, null);
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