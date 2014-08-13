
/*
 * Module Dependencies
 */
var log    = require('debug')('ksapi:api'),
    router = require('../libs/router'),
    Db     = require('../libs/db')
    utils  = require('../libs/utils');

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
        log('request for reload db cache');
        Db.prototype.current(app).then(function (r) {
            var db = r.data;
            return db.update(req);
        }).then(function (r) {
            log('reload db cache successfully');
            res.send(utils.res(true, 'db cache updated'));
        }, function(r) {
            log('reload db cache failed');
            res.send(utils.res(false, 'DB_CACHE_UPDATE_ERROR'));
        });
    });

    // search
    api.get('/:secret/search/:query', function(req, res) {
        log('search by queries: ' + JSON.stringify(req.queries));
        Db.prototype.current(app).then(function (r) {
            var db = r.data;
            return db.search(req);
        }).then(function (r) {
            log('found %d results', r.data.length);
            res.send(r);
        }, function (r) {
            log('search error');
            res.send(r);
        });
    });


    // retrieve full information of entry by uuid
    api.get('/:secret/get/:uuid', function(req, res) {
        log('retrieve full information of entry [ ' + req.uuid + ' ]');
        Db.prototype.current(app).then(function (r) {
            var db = r.data;
            return db.get(req);
        }).then(function (r) {
            log('retrieve entry successfully');
            res.send(r);
        }, function (r) {
            log('unable to get entry data');
            res.send(r);
        });
    });


    // retrieve specific field by uuid
    api.get('/:secret/get/:uuid/:field', function(req, res) {
        log('retrieve `' + req.field + '` of entry [ ' + req.uuid + ' ]');
        Db.prototype.current(app).then(function (r) {
            var db = r.data;
            return db.get(req);
        }).then(function (r) {
            log('retrieve ' + req.field + ' successfully');
            res.send(r);
        }, function (r) {
            log('unable to get entry data');
            res.send(r);
        });
    });

    return api;     // return api router object
}

module.exports = API;
