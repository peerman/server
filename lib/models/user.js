var logger = require('winstoon').createLogger('/model/user');
var bcrypt = require('bcrypt');

function UserModel (userCollection) {

    if(!(this instanceof UserModel)) {
        return new UserModel(userCollection);
    }

    this.create = function create (username, password, filelds, callback) {
        
        if(!username || username.trim() == "") {
            if(callback) callback({code: 'NO_USERNAME'});
            return;
        }

        //no spaces allowed
        username = username.replace(' ', '');

        userCollection.findOne({_id: username}, afterUserLoaded);

        var newUser;
        function afterUserLoaded (err, user) {
            
            if(err) {
                if(callback) callback(err);
            } else if(user) {
                //user exits
                if(callback) callback(new Error('USER_EXISTS'));
            } else {

                //no user, create a user then 
                newUser = filelds || {};
                newUser._id = username;
                hashPassword(password, afterHashGenerated);
            }
        }

        function afterHashGenerated(err, hash) {

            if(err) {
                callback(err);
            } else {
                newUser.password = hash;
                userCollection.insert(newUser, callback);
            }
        }
    };

    this.authenticate = function authenticate (username, password, callback) {
            
        userCollection.findOne({_id: username}, afterUserRetreived);

        function afterUserRetreived (err, user) {
            
            if(err) {
                if(callback) callback(err);
            } else if(!user) {
                logger.warn('no such user to authenticate', {user: username});
                if(callback) callback(null, false);
            } else {

                validateHash(password, user.password, callback);
            }
        }
    };

    this.setLoginToken = function setLoginToken(username, token, callback) {
        
        var query = {_id: username};
        var updateQuery = {$set: {
            loginToken: token
        }};
        userCollection.update(query, updateQuery, {upsert: true}, callback);
    };

    this.get = function get(username, callback) {

        var query = {_id: username};
        userCollection.findOne(query, callback);
    };
};

module.exports = UserModel;

/****** PRIVATE FUNCTIONS ******/

function hashPassword(plainText, callback) {

    bcrypt.genSalt(10, function(err, salt) {

        if(err) {
            callback(err);
        } else {
            bcrypt.hash(plainText, salt, callback);
        }
    });
}

function validateHash(plainText, hash, callback) {

    bcrypt.compare(plainText, hash, callback);
}