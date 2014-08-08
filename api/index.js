
/*
 * Module Dependencies
 */
var log = require('debug')('ksapi:api');
var express = require('express');
var db = require('../modules/cache');
var utils = require('../modules/utils');

/*
 * Factory of API router
 */
function API(app)
{
    var api = express.Router();

    /**
     *  Parameters
     */

    api.param(function(name, fn){
    if (fn instanceof RegExp) {
        return function(req, res, next, val) {
            var captures;
            if (captures = fn.exec(String(val))) {
                req.params[name] = captures[0];
                next();
            }
            else {
                next('route');
            }
        }
    }
});

    // user-secret
    api.param('secret', /^[0-9a-fA-F]+$/);

    // query string
    api.param('search', function (req, res, next, encoded) {
        var decoded = decodeURIComponent(encoded.replace(/\+/g, ' '));
        var queries = utils.queries(decoded);
        req.queries = queries;
        req.encoded = encoded;
        req.decoded = decoded;
        next();
    });

    // uuid (password, entry, group)
    api.param('uuid', function (req, res, next, encoded) {
        var decoded = decodeURIComponent(encoded.replace(/\+/g, ' '));
        req.encoded = encoded;
        req.decoded = decoded;
        next();
    });


    /**
     * Routers
     */
    // update cache
    api.get('/cache/update/:secret', function (req, res) {
        // verify secret
        if (req.params.secret !== utils.secret(app)) {
            res.send(utils.res(false, 'INVALID_SECRET'));
            return;
        }

        var cache = app.get('cache');
        log('request for reload db cache');
        cache.update().then(function (r){
            log('reload db cache successfully');
            res.send(r);
        }, function(r) {
            log('reload db cache failed');
            res.send(r);
        });
    });

    // search
    api.get('/search/:secret/:search', function(req, res) {
        // verify secret
        if (req.params.secret !== utils.secret(app)) {
            res.send(utils.res(false, 'INVALID_SECRET'));
            return;
        }
        var cache = app.get('cache');
        log("search for query: %s", req.decoded);
        cache.search(req.queries).then(function (r) {
            log('found %d results', r.data.length);
            res.send(r);
        }, function (r) {
            log('search error');
            res.send(r);
        });
    });


    // retrieve password by uuid
    api.get('/get/password/:secret/:uuid', function(req, res) {
        // verify secret
        if (req.params.secret !== utils.secret(app)) {
            res.send(utils.res(false, 'INVALID_SECRET'));
            return;
        }
        var cache = app.get('cache');
        log("retrieve password by entry uuid (%s)", req.decoded);
        cache.getPassword(req.decoded).then(function (r) {
            log('retrieve password successfully');
            res.send(r);
        }, function (r) {
            log('unable to get the password');
            res.send(r);
        });
    });

    return api;     // return api router object
}

module.exports = API;
