var uuid    = require('node-uuid');

function AccessModel(collection) {

    if(!(this instanceof AccessModel)) {
        return new AccessModel(collection);
    }

    this.createAccessToken = function createAccessToken(callback) {

        var accessToken = uuid.v4();
        collection.insert({_id: accessToken}, function(err) {

            if(err) {
                callback(err);
            } else {
                callback(null, accessToken);
            }
        });
    };

    this.setLoginToken = function setLoginToken(accessToken, token, callback) {
        
        var query = {_id: accessToken};
        var updateQuery = {$set: {
            loginToken: token
        }};
        collection.update(query, updateQuery, callback);
    };

    this.getLoginToken = function getLoginToken(accessToken, callback) {
        
        collection.findOne({_id: accessToken}, function(err, access) {

            if(err) {
                callback(err);
            } else if(access) {
                callback(null, access.loginToken);
            } else {
                callback(new Error('NO_SUCH_ACCESS_TOKEN'));
            }
        });
    };
}

module.exports = AccessModel;