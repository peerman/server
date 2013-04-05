//config
var config          = require('./conf/config.json');
var http            = require('http');
var express         = require('express');
var mongo           = require('mongodb');
var socketIo        = require('socket.io');

// better logging
var winstoon        = require('winstoon');
var logger          = winstoon.createLogger('/');
winstoon.add(winstoon.transports.Console);
winstoon.setRootLevel(config.logger.level);

//metrics support
var metrics = require('./lib/metrics');
metrics.startTracking(config['metrics'], 'signaling', '');

//app
var app = express();
var server = http.createServer(app);
var io = socketIo.listen(server);
io.set('log level', 1);
io.set('browser client minification', 1);

//db and models
mongo.MongoClient.connect(config.mongo.url, afterMongoConnected);

var port = parseInt(process.argv[2]) || config.ports.signaling;
logger.info('starting peerman signaling server', {port: port});
server.listen(port);

function afterMongoConnected (err, db) {
    
    if(err) throw err;

    //models
    var models = {};
    var directoryCollection = db.collection(config.mongo.collections.directory);
    var resourceCollection = db.collection(config.mongo.collections.resource);
    var accessCollection = db.collection(config.mongo.collections.access);

    models.directory = require('./lib/models/directory')(directoryCollection);
    models.resource = require('./lib/models/resource')(resourceCollection);
    models.access = require('./lib/models/access')(accessCollection);

    //clientManager
    var clientManager = require('./lib/clientManager')(io.sockets, models);
}

