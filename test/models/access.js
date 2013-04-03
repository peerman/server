var AccessModel   = require('../../lib/models/access');
var mongo           = require('mongodb');
var assert          = require('assert'); 

var $ = require('qbox').create();

mongo.MongoClient.connect('mongodb://localhost/_peerman', function(err, db) {

    if(err) throw err;
    $.db = db;
    $.start();
});

var COLLECTION = 'access';

suite('AccessModel', function() {

    test('.create()', _clean(function(coll, done) {

        var am = new AccessModel(coll);
        var t;
        am.createAccessToken(function(err, token) {

            assert.ifError(err);
            t = token;

            coll.findOne({_id: token}, validateState);
        });

        function validateState (err, access) {
            
            assert.ifError(err);
            assert.equal(access._id, t);
            done();
        }
    }));

    test('.setLoginToken()', _clean(function(coll, done) {

        var am = new AccessModel(coll);
        var loginToken = 'sdsd-sdsd';
        var t;
        am.createAccessToken(function(err, token) {

            assert.ifError(err);
            t = token;

            am.setLoginToken(t, loginToken, doValidateState);
        });

        function doValidateState(err) {
            
            assert.ifError(err);
            am.getLoginToken(t, validateState);
        }

        function validateState(err, lToken) {
            
            assert.ifError(err);
            assert.equal(lToken, loginToken);
            done();
        }
    }));

    test('.checkLoginToken()', _clean(function(coll, done) {

        var am = new AccessModel(coll);
        var loginToken = 'sdsd-sdsd';
        var t;
        am.createAccessToken(function(err, token) {

            assert.ifError(err);
            t = token;

            am.setLoginToken(t, loginToken, doValidateState);
        });

        function doValidateState(err) {
            
            assert.ifError(err);
            am.checkLoginToken(loginToken, validateState);
        }

        function validateState(err, accessToken) {
            
            assert.ifError(err);
            assert.equal(accessToken, t);
            done();
        }
    }));

    test('.checkLoginToken() - failed', _clean(function(coll, done) {

        var am = new AccessModel(coll);
        var t;
        am.createAccessToken(function(err, token) {

            assert.ifError(err);
            t = token;

            am.checkLoginToken('no-login-token', validateState);
        });

        function validateState(err, accessToken) {
            
            assert.ifError(err);
            assert.equal(accessToken, null);
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