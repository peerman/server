/*
    Common module to track application wide metrics and system metrics
    All the captured metrics will be send to mongo-metrics
*/
var os              = require('os');
var Minum           = require('minum');
var logger          = require('winstoon').createLogger('/metrics');
var usage           = require('usage');
var cluster         = require('cluster');
var qbox            = require('qbox');

var TRACKING = false;
var SYS_TRACKING = false;

var metrics = {};
var sendTimeMetrics = {};

var intervalHandlers = {};

var globalPids = []; //pids of processes spawn in the process

var appName; //application name, which can have more instances
var instanceName; //unique name for the instance

/*
    @param config - provide configuration options only need to call once
        possible params
            librato.email - email of the librato metrics account
            librato.token - token key
            interval - interval in millis to update the server
*/
exports.startTracking = function startTracking(config, _appName, _instanceName) {

    if(!TRACKING) {
        startTrackingLoop(config);
        appName = _appName;
        instanceName = _instanceName;

        TRACKING = true;
    }
};

exports.stopTracking = function stopTracking() {

    for(var key in intervalHandlers) {
        clearInterval(intervalHandlers[key]);
    }
};

exports.trackSystemMetrics = function trackSystem() {

    if(!SYS_TRACKING) {
        startSysTrackingLoop();
        SYS_TRACKING = true;
    }
};

exports.addPid = function addPid(pid) {

    if(globalPids.indexOf(pid) < 0) {
        globalPids.push(pid);
    }
};

exports.removePid = function removePid(pid) {

    var index = globalPids.indexOf(pid);
    globalPids.splice(index, 1);

    //remove node-usage history cache (only on linux)
    if(usage.clearHistory) {
        usage.clearHistory(pid);
    }
};

exports.trackMean = track(_trackingModeMean);

exports.trackSum = track(_trackingModeSum);

exports.trackAtSend = function trackAtSend(gauge, trackingFunction) {

    sendTimeMetrics[gauge] = trackingFunction;
};

function track(trackingMode) {

    return function(gauge, value) {

        if(TRACKING) {

            if(!metrics[gauge]) {

                metrics[gauge] = value;
            } else {

                trackingMode(gauge, value);
            }
        }
    };
}

function _trackingModeMean(gauge, value) {

    metrics[gauge] = (metrics[gauge] + value)/2;
}

function _trackingModeSum(gauge, value) {

    metrics[gauge] += value;
}

function startTrackingLoop(config) {

    var minumMetrics = new Minum(config['minum'].url);

    intervalHandlers['main'] = setInterval(sendGauges, config.interval || 5000);

    function sendGauges() {

        for(var gauge in metrics) {
            //only send if the metric is not null 
            if(metrics[gauge]) {
                minumMetrics.track(gauge, metrics[gauge], instanceName);
            }
        }

        resetMetrics();

        for(var gauge in sendTimeMetrics) {

            var value = sendTimeMetrics[gauge]();
            if(value) {
                minumMetrics.track(gauge, value, instanceName);
            }
        }
    }
}

function resetMetrics () {
    
    for(var key in metrics) {
        metrics[key] = null;
    }
}

function startSysTrackingLoop() {

    intervalHandlers['sys'] = setInterval(function() {

        var pids = getPids();
        var systrack  = qbox.create(pids.length);
        var cpu = 0;
        var memory = 0;

        pids.forEach(function(pid) {
            
            var env = { pid: pid };
            var options = { keepHistory: true }
            usage.lookup(pid, options, sumUsage.bind(env));
        });

        function sumUsage(err, result) {
            if(err) {
                logger.info('error when checking usage', {error: err.message, pid: this.pid});
            } else {
                cpu += result.cpu;
                memory += result.memory;
            }
            systrack.tick();
        }

        systrack.ready(function() {    

            var memoryInMb = (memory/(1024 * 1024)).toFixed(2);
            memoryInMb = parseFloat(memoryInMb);

            // logger.debug('tracking system usage', { cpu: cpu, memory: memoryInMb, appName: appName });
            exports.trackMean('cpu-' + appName, cpu);
            exports.trackMean('memory-' + appName, memoryInMb);
        });
        
    }, 1000);
}


function getPids () {
    
    var pids = [process.pid];

    //copy global pids
    globalPids.forEach(function(pid) {
        pids.push(pid);
    });

    //get cluster pids
    if(cluster.isMaster) {
        for(var id in cluster.workers) {
            pids.push(cluster.workers[id].process.pid);
        }
    }

    return pids;
}