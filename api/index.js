
/*
 * Module Dependencies
 */
var log    = require('debug')('ksapi:api'),
    router = require('../modules/router'),
    utils  = require('../modules/utils');

/*
 * Factory of API router
 */
function API(app)
{
    var api = router(app);
    /**
     * Routers
     */

    api.get('/:secret/up', function (req, res) {
        res.send(req.query);
    });

    // update cache
    api.get('/:secret/cache/update', function (req, res) {
        // verify secret
        if (req.params.secret !== utils.secret(app)) {
            res.send(utils.res(false, 'INVALID_SECRET'));
            return;
        }

        var cache = app.get('cache');
        log('request for reload db cache');
        cache.update(req).then(function (r){
            log('reload db cache successfully');
            res.send(r);
        }, function(r) {
            log('reload db cache failed');
            res.send(r);
        });
    });

    // search
    api.get('/:secret/search/:query', function(req, res) {
        // verify secret
        if (req.params.secret !== utils.secret(app)) {
            res.send(utils.res(false, 'INVALID_SECRET'));
            return;
        }
        var cache = app.get('cache');
        log("search for query: %s", req.decodedQuery);
        cache.search(req).then(function (r) {
            log('found %d results', r.data.length);
            res.send(r);
        }, function (r) {
            log('search error');
            res.send(r);
        });
    });


    // retrieve password by uuid
    api.get('/:secret/get/password/:uuid', function(req, res) {
        // verify secret
        if (req.params.secret !== utils.secret(app)) {
            res.send(utils.res(false, 'INVALID_SECRET'));
            return;
        }
        var cache = app.get('cache');
        log("retrieve password by entry uuid (%s)", req.decodedUUID);
        cache.getPassword(req).then(function (r) {
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
