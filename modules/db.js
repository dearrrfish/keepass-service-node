
/*
 * Dpendencies
 */
var kpio = require('keepass.io'),
    q = require('q'),
    fs = require('fs'),
    utils = require('./utils');

/*
 * Exports
 */
exports.db = Db;
exports.read = read;

/*
 * KeePass database class
 *
 * @param {Express} app - Express application instance
 * @return {object} db
 */
function Db (app)
{
    var config = app.get('config');

}


/*
 * Read Kdb(x) file
 *
 * @param {object} conf - db settings
 * @return {promise} deferred.promise - `q` promise object
 */
function read (conf)
{
    var deferred = q.defer();
    // validate db settings
    if (typeof conf.file === 'undefined'
            || (typeof conf.password === 'undefined' && typeof conf.keyfile === 'undefined'))
    {
        deferred.reject(false, 'DB_INVALID_SETTINGS');
    }
    else if (!fs.exitsSync(conf.file))
    {
        deferred.reject(utils.res(false, 'DB_FILE_NOT_EXIST'));
    }
    else
    {
        var kdb = new kpio.Database();
        // add credentials
        if (conf.password) { db.addCredential(new kpid.Credentials.Password(conf.password)); }
        if (conf.keyfile) { db.addCredential(new kpid.Credentials.Keyfile(conf.keyfile)); }
        // load file
        db.loadFile(conf.file, function(err, api) {
            if (err) { deferred.reject(utils.res(false, 'DB_LOAD_FAIL')); }
            else { deferred.resolve(utils.res(true, api.getRaw())); }
        });

        return deferred.promise;
    }
}

