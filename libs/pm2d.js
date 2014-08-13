/**
 * Dependencies
 */
var pm2 = require('pm2'),
    q = require('q'),
    utils = require('./utils');

module.exports = Pm2d.prototype;

function Pm2d ()
{
    //this.rc = {};
    //this.home = utils.syshome();
}

/**
 * Connect to PM2 daemon
 */
Pm2d.prototype.connect = function () {
    var deferred = q.defer();
    pm2.connect(function (err) {
        if (err) {
            deferred.reject(utils.res(false, ['PM2_CONNECT_ERROR', err]));
        }
        else {
            deferred.resolve(utils.res(true, 'pm2 connect success'));
        }
    });
    return deferred.promise;
}

/**
 * Disconnect from PM2 daemon
 */
Pm2d.prototype.disconnect = function() {
    var deferred = q.defer();
    pm2.disconnect(function (err, proc) {
        if (err) {
            deferred.reject(utils.res(false, ['PM2_DISCONNECT_ERROR', err]));
        }
        else {
            deferred.resolve(utils.res(true, proc));
        }
    });
    return deferred.promise;
}

/**
 * Start process(es)
 */
Pm2d.prototype.start = function (app) {
    var deferred = q.defer();
    if (!utils.isDefined(app)) {
        deferred.reject(utils.res(false, ['PM2_START_ERROR', 'app conf is undefined']));
    }
    else if (utils.isArray(app)) {
        var funcs = [];
        app.forEach(function (a) { funcs.push(Pm2d.prototype.start(a)); });
        q.allSettled(funcs).then(function (rs) {
            var successes = [];
            var errors = [];
            rs.forEach(function (r) {
                if (r.state == 'fulfilled') {
                    successes.push(r.value.data);
                }
                else if (utils.isDefined(r.reason.extra)) {
                    errors.push(r.reason.extra);
                }
                else {
                    errors.push('general error');
                }
            });
            if (!utils.empty(errors)) {
                deferred.reject(utils.res(false, ['PM2_START_ERROR'].concat(errors)));
            }
            else {
                deferred.resolve(utils.res(true, successes));
            }
        });
    }
    else {
        // verify mandatory app settings
        if (!utils.isDefined([app.script, app.options, app.options.name])) {
            deferred.reject(utils.res(false, ['PM2_START_ERROR', 'app conf missing mandatory options']));
        }
        else {
            Pm2d.prototype.describe(app.options.name).then(function (res) {
                deferred.reject(utils.res(false, ['PM2_START_ERROR', "named processs already exists"]));
            }, function(res) {
                pm2.start(app.script, app.options, function(err, proc) {
                    if (err) {
                        deferred.reject(utils.res(false, 'PM2_START_ERROR'));
                    }
                    else {
                        deferred.resolve(utils.res(true, proc));
                    }
                });
            });
        }
    }

    return deferred.promise;
}


/**
 * Graceful reload process
 */
Pm2d.prototype.gracefulReload = function (proc) {
    if (!utils.isDefined(proc) || (utils.isArray && utils.empty(proc))) {
        proc = 'all';
    }
    if (utils.isArray(proc) && !empty(proc)) {
        var funcs = [];
        proc.forEach(function (p) {
            funcs.push(Pm2d.prototype.gracefulReload(p));
        });
        q.allSettled(funcs).then(function (rs) {
            var successes = [];
            var errors = [];
            rs.forEach(function (r) {
                if (r.state == 'fulfilled') {
                    successes.push(r.value.data);
                }
                else if (utils.isDefined(r.reason.extra)) {
                    errors.push(r.reason.extra);
                }
                else {
                    errors.push('general error');
                }
            });

            if (!utils.empty(errors)) {
                deferred.reject(utils.res(false, ['PM2_START_ERROR'].concat(errors)));
            }
            else {
                deferred.resolve(utils.res(true, successes));
            }
        });
    }
    else {
        pm2.gracefulReload(proc, function(err, proc) {
            if (err) {
                deferred.reject(utils.res(false, 'PM2_GRACEFUL_RELOAD_ERROR'));
            }
            else {
                deferred.resolve(utils.res(true, proc));
            }
        });
    }

    return deferred.promise;
}

/**
 * Describe process
 */
Pm2d.prototype.describe = function (proc) {
    var deferred = q.defer();
    pm2.describe(proc, function (err, list) {
        if (err) {
            deferred.reject(utils.res(false, ['PM2_DESCRIBE_ERROR', err]));
        }
        else if (utils.empty(list)) {
            deferred.reject(utils.res(false, ['PM2_DESCRIBE_ERROR', 'no such named process']));
        }
        else {
            deferred.resolve(utils.res(true, list));
        }
    });
    return deferred.promise;
}

/**
 * List all processes
 */
Pm2d.prototype.list = function () {
    var deferred = q.defer();
    pm2.list(function (err, list) {
        if (err) {
            deferred.reject(utils.res(false, ['PM2_LIST_ERROR', err]));
        }
        else if (utils.empty(list)) {
            deferred.reject(utils.res(false, ['PM2_LIST_ERROR', 'no process']));
        }
        else {
            deferred.resolve(utils.res(true, list));
        }
    });
    return deferred.promise;
}


/**
 * Kill PM2 Daemon
 */
Pm2d.prototype.kill = function() {
    var deferred = q.defer();
    pm2.killDaemon(function (err) {
        if (err) {
            deferred.reject(utils.res(false, ['PM2_KILL_ERROR', err]));
        }
        else {
            deferred.resolve(utils.res(true, null));
        }
    });

    return deferred.promise;
}
