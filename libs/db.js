
/*
 * Dpendencies
 */
var log   = require('debug')('ksapi:db'),
    kpio  = require('keepass.io'),
    q     = require('q'),
    fs    = require('fs'),
    utils = require('./utils');

/*
 * Exports
 */
module.exports = Db;

// Db object
function Db(conf) {
    this.conf  = conf;
    this.loads = {};
}

///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * return current db loads if available
 */
Db.prototype.current = function (app) {
    var deferred = q.defer();
    var config = app.get('config');
    if (!utils.isDefined(config.db.current)) {
        deferred.reject(utils.res(false, 'DB_CURRENT_NOT_SET'));
    }
    else {
        return Db.prototype.use(app, config.db.current);
    }
    return deferred.promise;
}


/**
 * Switch or load db to current use
 */
Db.prototype.use = function (app, id) {
    var deferred = q.defer();
    var config = app.get('config');
    // validate if db config exists
    if (!utils.has(config.db, id)) {
        deferred.reject(utils.res(false, ['DB_CONFIG_NOT_EXIST', id]));
    }
    else {
        // set current db
        config.db.current = id;
        // full configuration with default values
        var conf = utils.full(config.db[id], config.db.default_conf);
        conf.id = id;

        log('db conf: ' + JSON.stringify(conf));

        var cache = app.get('db_' + id);
        // cache doesn't exist
        if (!utils.isDefined(cache)) {
            var db = new Db(conf);
            app.set('db_' + id, db);
            deferred.resolve(utils.res(true, db));
            log('db cache doesn\'t exist. create new db object');
        }
        else {
            // update db conf, and return db
            cache.conf = conf;
            deferred.resolve(utils.res(true, cache));
            log('db cache exists. loaded from memory');
        }
    }
    return deferred.promise;
}

/**
 * Exists db cache in app, by db ID
 */
Db.prototype.exists = function (app, id) {
    return utils.isDefined(app.get('db_' + id));
}


///////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Update/reload db cache
 */
Db.prototype.update = function (cache_enabled) {
    var self = this;
    var deferred = q.defer();
    log('update db cache [ ' + self.conf.id + ' ]');
    readKdb(self.conf).then(function (res) {
        log('read kdbx successfully [ ' + self.conf.file + ' ]');
        // listing raw data
        var loads = listKdb(res.data);
        log('list kdb data successfully loads');
        // store loads to cache
        if (utils.isDefined(cache_enabled) && cache_enabled) {
            self.loads = loads;
        }
        deferred.resolve(utils.res(true, loads));
    });
    return deferred.promise;
}

/**
 * Load/init db cache
 */
Db.prototype.load = function () {
    var self = this;
    var deferred = q.defer();

    // cache is enabled and memory loads is valid
    if (self.conf.cache && utils.has(self.loads, ['entries', 'passwords', 'groups'])) {
        log('loaded db cache [ ' + self.conf.id + ' ]');
        deferred.resolve(utils.res(true, self.loads));
    }
    // otherwise read data from db file
    else {
        log('load db cache failed. try to update new cache [ ' + self.conf.id + ' ]');
        return self.update(self.conf.cache);
    }

    return deferred.promise;
}

/**
 * Search method
 *
 * @param {Express.Request} req - Express request object.
 *                                including 'req.query'(options) and 'req.queries' (array of formatted queries)
 */
Db.prototype.search = function (req) {
    var self      = this;
    var deferred  = q.defer();
    var results   = [];

    var queries   = req.queries;
    var options   = req.query;

    log('search: query: %s ', JSON.stringify(req.queries));
    log('search: options: %s', JSON.stringify(options));

    var titleOnly = (utils.isDefined(options.title_only)) ? (options.title_only == 'yes') : self.conf.title_only;
    log("title-only search: " + titleOnly);
    // search targets
    self.load().then(function (res) {
        log('db data loaded.');
        var entries = res.data.entries,
            groups  = res.data.groups;

        // which fields used to match query
        // `all`   - match keywords in all available fields
        // `title` - Title of entry
        // `group` - Group name contains entry
        // `path`  - Full path name of entry, e.g. /Root/Internet/Shopping
        // `url`   - URL of entry
        // `user`  - UserName of entry
        // `notes` - Notes of entry
        var queryFields = titleOnly ? ['all', 'title'] : Object.keys(queries);

        for (var eid in entries) {
            var e = entries[eid];
            // simple scoring method: score = sum((is_match(field) ? 1 : 0) * weight[field])
            var score = 0;  // initial score

            // contruct group & full path
            e.group = groups[e.guuid].name;
            e.path = '';
            for (var ip = 0; ip < groups[e.guuid].parents.length; ip++) {
               e.path += groups[groups[e.guuid].parents[ip]].name + '/';
            }
            e.path += e.group + '/';

            // matching keyword in fields, a matched entry must fulfilled all given fields
            var entry_matched = queryFields.every(function (qf) {
                // no query keywords in current field, skip this field
                if (!(qf in queries)) { return true; }

                // matching current field, all given keywords in current field must match
                var qf_matched = queries[qf].every(function (k) {
                    var matched = false;     // a query mark that count if keywords match the field
                    var regex = new RegExp(k, 'i'); // regex object

                    // default to search in all available fields
                    if (qf == 'all') {
                        self.conf.fields.forEach(function (a_qf) {
                            var a_content = e[a_qf];
                            if (a_content.match(regex) !== null) {
                                matched = true;
                                score += utils.weights[a_qf];
                            }
                        });
                    }
                    else {
                        var content = e[qf];
                        // matching
                        if (content.match(regex) !== null) {
                            matched = true;
                            score += utils.weights[qf];
                        }
                    }

                    return matched;     // return if the keyword matched current field
                });

                return qf_matched;      // return if all keywords matched current field
            });

            // push into result set if all `keywords in field` matching passed
            if (entry_matched) { results.push({entry: e, score: score}); }
        }

        // sort results by score if more than one found
        if (results.length > 1) { results.sort(utils.compareScore); }

        deferred.resolve(utils.res(true, results));
    });

    // return search promise
    return deferred.promise;
}


/**
 * Retrieve entry info by entry UUID
 */
Db.prototype.get = function (req) {
    var self = this;
    var deferred = q.defer();
    var uuid = req.uuid;
    var qf = (utils.isDefined(req.field)) ? req.field : 'full';
    self.load().then(function (res) {
        var entries   = res.data.entries,
            passwords = res.data.passwords,
            groups    = res.data.groups;

        // validate uuid exists
        if (!utils.has(entries, uuid)) {
            deferred.reject(utils.res(false, ['GET_ENTRY_NOT_EXIST', uuid]));
        }

        // return content;
        var result = {};
        switch(qf) {
            case 'title':
                result.title = entries[uuid].title;
                break;
            case 'url':
                result.url = entries[uuid].url;
                break;
            case 'notes':
                result.notes = entries[uuid].notes;
                break;
            case 'user':
                result.user = entries[uuid].user;
                break;
            case 'full':
                result = utils.merge(result, entries[uuid]);
            case 'group':
                result.group = groups[entries[uuid].guuid].name;
                if (qf != 'full') break;
            case 'path':
                // contruct path
                var path = '';
                var e = entries[uuid];
                for (var ip = 0; ip < groups[e.guuid].parents.length; ip++) {
                    path += groups[groups[e.guuid].parents[ip]].name + '/';
                }
                path += e.group + '/';
                result.path = path;
                if (qf != 'full') break;
            case 'password':
                result.password = passwords[uuid];
                if (qf != 'full') break;
        }

        deferred.resolve(utils.res(true, result));
    });

    return deferred.promise;
}




///////////////////////////////////////////////////////////////////////////////////////////////////
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
    if (!utils.isDefined(conf.file) || (!utils.isDefined(conf.password) && !utils.isDefined(conf.keyfile)))
    {
        log('db invalid settings');
        log(JSON.stringify(conf));
        deferred.reject(utils.res(false, 'DB_INVALID_SETTINGS'));
    }
    else if (!fs.existsSync(conf.file))
    {
        log('db read file doesn\'t exist');
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
                log('db load file content failed');
                deferred.reject(utils.res(false, 'DB_FILE_READ_ERROR'));
            }
            else
            {
                log('db load file successfully');
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
        if (!utils.isArray(group)) { group = [group]; }

        // loop groups
        group.forEach(function (g, gi) {
            // if group is a child
            if (typeof family !== 'undefined') { family.push(g.UUID); }
            // add group record
            _groups[g.UUID] = { index: gi, uuid:g.UUID, name:g.Name, parents:parents, entries:[], children:[] };

            // listing entries under current group, probably empty
            if (utils.has(g, 'Entry'))
            {
                var entries = g.Entry;
                // single entry
                if (!utils.isArray(entries)) { entries = [entries]; }
                // loop entries
                entries.forEach(function (e, ei) {
                    var estr = utils.translateEntryString(e.String);
                    // store entry listing
                    _entries[e.UUID] = {
                        uuid     : e.UUID,
                        title    : estr.Title,
                        user     : estr.UserName,
                        url      : estr.URL,
                        notes    : estr.Notes,
                        guuid    : g.UUID
                    };

                    // store password
                    _passwords[e.UUID] = estr.Password;

                    // store entry uuid in group.entries
                    _groups[g.UUID].entries.push(e.UUID);
                });
            }

            // listing subgroups under current one, probably empty
            if (utils.has(g, 'Group'))
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
