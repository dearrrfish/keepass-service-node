
/*
 * Module Dependencies
 */
var log = require('debug')('ksapi:router');
var express = require('express');
var utils = require('./utils');

/**
 * Exports
 */
module.exports = Router;

function Router (app)
{
    var router = express.Router();

    /**
     * Parameters
     */
    // callback is regex
    router.param(function(name, fn) {
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
    router.param('secret', /^[0-9a-fA-F]+$/);

    // query string
    router.param('query', function (req, res, next, encoded) {
        var decoded = decodeURIComponent(encoded.replace(/\+/g, ' '));
        var queries = utils.queries(decoded, app.get('config').query.fields);
        req.queries = queries;
        req.encodedQuery = encoded;
        req.decodedQuery = decoded;
        next();
    });

    // uuid (password, entry, group)
    router.param('uuid', function (req, res, next, encoded) {
        var decoded = decodeURIComponent(encoded.replace(/\+/g, ' '));
        req.encodedUUID = encoded;
        req.decodedUUID = decoded;
        next();
    });

    // options (including mandatory secret)
    router.param('options', function (req, res, next, encoded) {
        req.encodedOptions = encoded;
        console.log(encoded);
        var decoded = (encoded.replace(/\+/g, ' '));
        // options must start with "?"
        // ?title_only=0&fields=title%2Cgroup&secret=1234567
        if (encoded.indexOf('?') == 0) {
            var options = {};
            var optStringArr = encoded.slice(1).split('&');
            optStringArr.forEach(function (s) {
                var eqIndex= s.indexOf('=');
                // must have an option name
                if (eqIndex <= 0) { return; }
                var opt = s.slice(0, eqIndex);
                var val = decodeURIComponent(s.slice(eqIndex+1).replace(/\+/g, ' '));
                options[opt] = val;
            });
            req.options = options;
        }
        next();
    });

    // return router object
    return router;
}
