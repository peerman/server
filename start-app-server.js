//config
var config          = require('./conf/config.json');
var express         = require('express');
var mongo           = require('mongodb');

// better logging
var winstoon        = require('winstoon');
var logger          = winstoon.createLogger('/');
winstoon.add(winstoon.transports.Console);
winstoon.setRootLevel(config.logger.level);

//app
var app = express();
app.use(express.cookieParser());
app.use(express.static(__dirname + '/core', {maxAge: 1000 * 3600 * 24}))

//db and models
mongo.MongoClient.connect(config.mongo.url, afterMongoConnected);

var port = parseInt(process.argv[2]) || config.ports.app;
logger.info('starting peerman app server', {port: port});
app.listen(port);

function afterMongoConnected (err, db) {
    
    if(err) throw err;

    //models
    var models = {};
    var accessCollection = db.collection(config.mongo.collections.access);

    models.access = require('./lib/models/access')(accessCollection);

    //load routes
    require('./lib/routes')(app, models);
}

