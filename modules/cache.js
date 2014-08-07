
/*
 * Dpendencies
 */
var log   = require('debug')('ksapi:cache'),
    kpio  = require('keepass.io'),
    q     = require('q'),
    fs    = require('fs'),
    utils = require('./utils');

/*
 * Exports
 */
module.exports = Cache;

function Cache(app) {
    // db object
    var cache = {};
    //if (typeof app.get('db') === 'object') { return app.get('db'); }

    var config = app.get('config');

    /**
     * Update/reload db cache
     *
     * @return {q.promise}
     */
    cache.update = function () {
        var deferred = q.defer();
        readKdb(config.kdb).then(function (res) {
            // listing raw data
            var loads = listKdb(res.data);

            cache.entries = loads.entries;
            cache.groups = loads.groups;
            cache.passwords = loads.passwords;
            deferred.resolve(utils.res(true, cache));
        });
        return deferred.promise;
    }

    /**
     * Load/init db cache
     *
     * @return {q.Promise}
     */
    cache.load = function () {
        var deferred = q.defer();

        // cache is enabled
        if (config.cache.enabled) {
            // if cache objects don't exist, run update()
            if (typeof cache.entries === 'undefined' || typeof cache.groups === 'undefined'
                    || typeof cache.passwords === 'undefined') {
                log(utils.err_message('CACHE_NOT_EXIST'));
                return cache.update();
            }
            // else load cache in memory
            else {
                deferred.resolve(utils.res(true, {
                    entries   : cache.entries,
                    passwords : cache.passwords,
                    groups    : cache.groups
                }));
            }
        }
        // cache is disabled, read from db file
        else {
            readKdb (config.kdb).then (function (res) {
                var loads = listKdb(res.data);
                deferred.resolve(utils.res(true, {
                    entries   : loads.entries,
                    passwords : loads.passwords,
                    groups    : loads.groups
                }));
            }, function (res) {
                deferred.reject(res);
            });
        }

        return deferred.promise;
    }

    /**
     * Search
     *
     * @param {array} queries - array of query strings
     * @return {q.promise} results - search results
     */
    cache.search = function (queries) {
        console.log(queries);
        var deferred = q.defer();
        var results = [];
        // search targets
        cache.load().then(function (res) {
            log('cache loaded.');
            var entries = res.data.entries,
                groups = res.data.groups;

            var queryFields = (config.query.titleOnly) ? ['title'] : config.query.fields;

            for (var eid in entries) {
                var e = entries[eid];
                // simple scoring method: score = sum((is_match(field) ? 1 : 0) * weight[field])
                var score = 0;  // initial score


                // contruct group/path
                e.group = groups[e.guuid].name;
                var path = '';
                for (var ip = 0; ip < groups[e.guuid].parents.length; ip++) {
                    path += groups[groups[e.guuid].parents[ip]].name + '/';
                }
                path += e.group + '/';
                e.path = path;

                queryFields.every(function (qf) {
                    // no query keywords in current field, skip this field
                    if (!(qf in queries)) { return true; }

                    var qf_matches = 0;

                    queries[qf].forEach(function (k) {
                        var content = e[qf];
                        // matching
                        if (content.match(new RegExp(k, 'i')) !== null) {
                            qf_matches += 1;
                            score += utils.weights[qf];
                        }
                    });

                    // at least one match in current field, otherwise skip this entry
                    if (qf_matches == 0) {
                        score = 0;  // reset score, so that we can knock out this entry
                        return false;
                    }
                });
                if (score > 0) {
                    log('found matched entry \'%s\'', e.name);
                    results.push({entry: e, score: score});
                }
            }

            deferred.resolve(utils.res(true, results));

        }, function (res) {
            deferred.reject(utils.res(false, 'SEARCH_ERROR'));
        });

        return deferred.promise;
    }

    // return cache object
    return cache;
}



/*
 * Read Kdb(x) file
 *
 * @param {object} conf - db settings
 * @return {promise} deferred.promise - `q` promise object
 */
function readKdb (conf)
{
    var deferred = q.defer();
    // validate db settings
    if (typeof conf.file === 'undefined'
            || (typeof conf.password === 'undefined' && typeof conf.keyfile === 'undefined'))
    {
        deferred.reject(utils.res(false, 'DB_INVALID_SETTINGS'));
    }
    else if (!fs.existsSync(conf.file))
    {
        deferred.reject(utils.res(false, 'DB_FILE_NOT_EXIST'));
    }
    else
    {
        var db = new kpio.Database();
        // add credentials
        if (conf.password) { db.addCredential(new kpio.Credentials.Password(conf.password)); }
        if (conf.keyfile)  { db.addCredential(new kpio.Credentials.Keyfile(conf.keyfile)); }
        // load file
        db.loadFile(conf.file, function(err, api) {
            if (err)
            {
                deferred.reject(utils.res(false, 'DB_FILE_READ_ERROR'));
            }
            else
            {
                deferred.resolve(utils.res(true, api.getRaw()));
            }
        });

        return deferred.promise;
    }
}


/*
 * Listing db entries and groups
 *
 * @param {object} raw - raw db file object
 * @return {object} list - customized listing object
 */
function listKdb (raw)
{
    var _groups    = {};
    var _entries   = {};
    var _passwords = {};
    var _parents   = [];

    // root group
    var root = raw.KeePassFile.Root.Group;
    // recursively listing groups
    listGroup(root, _parents);

    return {
        entries   : _entries,
        passwords : _passwords,
        groups    : _groups
    }
    /*
    * Listing group
    *
    * @param {object} group
    * @param {array} parents
    * @return {Promise} deferred.promise
    */

    function listGroup (group, parents, family)
    {
        // if only one group, put into an array, e.g. root group
        if (!utils.is_array(group)) { group = [group]; }

        // loop groups
        group.forEach(function (g, gi) {
            // if group is a child
            if (typeof family !== 'undefined') { family.push(g.UUID); }
            // add group record
            _groups[g.UUID] = { index: gi, uuid:g.UUID, name:g.Name, parents:parents, entries:[], children:[] };

            // listing entries under current group, probably empty
            if (utils.has.call(g, 'Entry'))
            {
                var entries = g.Entry;
                // single entry
                if (!utils.is_array(entries)) { entries = [entries]; }
                // loop entries
                entries.forEach(function (e, ei) {
                    var estr = utils.translateEntryString(e.String);
                    _entries[e.UUID] = {
                        uuid     : e.UUID,
                        title    : estr.Title,
                        user     : estr.UserName,
                        url      : estr.URL,
                        notes    : estr.Notes,
                        guuid    : g.UUID
                    };

                    // store entry uuid in group.entries
                    _groups[g.UUID].entries.push(e.UUID);
                });
            }

            // listing subgroups under current one, probably empty
            if (utils.has.call(g, 'Group'))
            {
                var children = g.Group;
                // add current group into parents list of its children
                var cparents = parents.concat(g.UUID);
                // listing sub groups
                listGroup(children, cparents, _groups[g.UUID].children);
            }

        });

    }

}
                    
