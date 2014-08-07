
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

    api.param(':search', function (req, res, next, qstring) {
        var decoded = decodeURIComponent(qstring.replace(/\+/g, ' '));
        console.log(decoded);
        var queries = utils.queries(decoded);
        //console.log(queries);
        req.queries = queries;
        next();
    });


    api.get('/search/:search', function(req, res) {
        var qstring = "TMS title:AWS path:Gracenote";
        var cache = app.get('cache');
        cache.search(req.queries).then(function (r) {
            console.log(r);
            res.send(r.data);
        });
    });

    return api;
}

module.exports = API;
