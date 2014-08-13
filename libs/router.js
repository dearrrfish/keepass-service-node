
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
    router.param('secret', function (req, res, next, secret) {
        if (secret.match(/^[\da-fA-F]+$/) == null || secret !== utils.secret(app)) {
            res.send(utils.res(false, 'INVALID_SECRET'));
            return;
        };
        req.secret = secret;
        next();
    });

    // query string
    router.param('query', function (req, res, next, query) {
        console.log(query);
        var decoded = utils.urldecode(query);
        var queries = utils.queries(decoded);
        req.queries = queries;
        next();
    });

    // uuid (password, entry, group)
    router.param('uuid', function (req, res, next, uuid) {
        req.uuid = uuid;
        next();
    });

    // entry field
    router.param('field', function (req, res, next, field) {
        req.field = (utils.isDefined(field)) ? field : 'full';
        next();
    });

    // return router object
    return router;
}
