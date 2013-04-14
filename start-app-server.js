//config
var config          = require('./conf/config.json');
var express         = require('express');
var mongo           = require('mongodb');
var uuid            = require('node-uuid');

// better logging
var winstoon        = require('winstoon');
var logger          = winstoon.createLogger('/');
winstoon.add(winstoon.transports.Console);
winstoon.setRootLevel(config.logger.level);

//app
var app = express();
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.static(__dirname + '/core', {maxAge: 1000 * 3600 * 24}));
app.use(express.static(__dirname + '/public', {maxAge: 1000 * 3600 * 24}));
app.engine('html', require('ejs').renderFile);

//metrics support
var instanceName = uuid.v4();
var metrics = require('./lib/metrics');
if(process.env.NODE_ENV == 'production') {
    metrics.startTracking(config['metrics'], 'app', instanceName);
    metrics.trackSystemMetrics();
}

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
    var userCollection = db.collection(config.mongo.collections.user);

    models.access = require('./lib/models/access')(accessCollection);
    models.user = require('./lib/models/user')(userCollection);

    //load routes
    require('./lib/routes')(app, models);
}

