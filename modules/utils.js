/**
 * Dependencies
 */
var crypto = require('crypto'),
    errors = require('./errors');

var fields = {
    title     : "Title",
    group     : "Group",
    path      : "Path",
    url       : "URL",
    user      : "UserName",
    password  : "Password",
    notes     : "Notes"
}

exports.weights = {
    title : 3,
    group : 1,
    path  : 1,
    url   : 1
}

/*
 * Parse query string
 * e.g. google title:mail p:internet g:email
 *  => {title: ["google", "mail"], group:["email"], path:["internet"]}
 *
 *
 * param {string} qs - query string
 * param {string} qfs - available query fields
 * return {object} queries - array of query objects
 */
exports.queries = function (qs, qfs) {
    var arr = {};
    qs.split(/\s+/).forEach(function (q) {
        if (q === '') { return; }
        var colonIndex = q.indexOf(':');
        // default to search in all available fields
        if (colonIndex <= 0) {
            exports.pushInObject(q, 'all', arr);
            return;
        }

        var field = q.slice(0,colonIndex),
            content = q.slice(colonIndex +1);

        // search  is empty
        if (content === '') { return; }

        switch(field.toLowerCase()) {
            case 'title':
            case 't':
                exports.pushInObject(content, 'title', arr);
                break;
            case 'group':
            case 'g':
                exports.pushInObject(content, 'group', arr);
                break;
            case 'path':
            case 'p':
                exports.pushInObject(content, 'path', arr);
                break;
            case 'url':
            case 'l':
                exports.pushInObject(content, 'url', arr);
                break;
            case 'user':
            case 'username':
            case 'u':
                exports.pushInObject(content, 'user', arr);
                break;
            case 'notes':
            case 'note':
            case 'n':
                exports.pushInObject(content, 'notes', arr);
                break;
        }
    });

    return arr;
}


/**
 * Error code/message getter
 */
exports.errs = function errs(err, _errs)
{
    if (typeof err !== 'undefined' && !(err in errors.code)) { err = errors.code['UNKNOWN_ERROR']; }
    var errs = (typeof err !== 'undefined')
             ? [{ code: errors.code[err], message: errors.message[errors.code[err]] }] : [];

    return (typeof _errs !== 'undefined') ? errs.concat(_errs) : errs;
}

/**
 * Generate error message string
 */
exports.err_message = function (err) {
    return (typeof err === 'undefined' || typeof errors.code[err] === 'undefined') ? ""
           : erros.message[errors.code[err]] + ' (' + errors.code[err] + ')';
}


/**
 * Response generator
 */
exports.res = function response(status, data, ext)
{
    return (!status || status == 'KO') ? { status: 'KO', errors: exports.errs(data, ext) }
                                       : { status: 'OK', data: data };
}
/*
 * Translate `Key` `Value` array to proper object
 *
 * @param {array} arr
 * @return {object} obj
 */
exports.translateEntryString = function translateEntryString(arr)
{
    var obj = {};
    arr.forEach(function (e) {
        obj[e.Key] = (e.Key == 'Password') ? e.Value._ : e.Value;
    });
    return obj;
}



/**
 * Replace values in object
 *
 * @param {object} o(bject)
 * @param {string} m(atch)
 * @param {string} r(eplace)
 * @return
 */
exports.replace = function replace(o, m, r)
{
    for (var key in o)
    {
        if (exports.has.call(o, key) && o[key])
        {
            if (typeof o[key] === 'object')
            {
                exports.replace(o[key], m, r);
            }
            else if(typeof o[key] === 'string')
            {
                o[key] = o[key].replace(m, r);
            }
        }
    }
    return o;
}

/**
 * Merge `b` to `a`
 *
 * @param {object} a
 * @param {object} b
 * @return {object} a
 *
 */
exports.merge = function merge(a, b)
{
    for (var key in b)
    {
        if (exports.has.call(b, key) && typeof b[key] !== 'undefined')
        {
            if ('object' === typeof b[key])
            {
                if ('undefined' === typeof a[key]) { a[key] = {}; }
                exports.merge(a[key], b[key]);
            }
            else
            {
                a[key] = b[key];
            }
        }
    }
    return a;
}

/**
 * hasOwnProperty
 */
exports.has = Object.prototype.hasOwnProperty;

/*
 * isArray()
 */
exports.is_array = function is_array(o)
{
    return Object.prototype.toString.call(o) === '[object Array]';
}

/**
 * push item into array(may not exist) in an object
 */
exports.pushInObject = function pushInObject(item, arr, object) {
    if (!exports.has.call(object, arr)) { object[arr] = []; }
    if (!exports.is_array(object[arr])) { return false; }
    object[arr].push(item);
    return true;
}

/*
 * is defined
 */
exports.defined = function (vs) {
    if (exports.is_array(vs)) {
        return vs.every(function (v) {
            return (typeof v !== 'undefined');
        });
    }
    else {
        return (typeof vs !== 'undefined');
    }
}

/*
 * Hash
 */
exports.hash = function (source, algo) {
    if (!exports.defined([source. algo])) { return false; }
    var hash = crypto.createHash(algo);
    hash.update(source);
    var hashed = hash.digest('hex');
    return hashed;
}

/*
 * Crypt and decrypt
 */
// get secret: process.env > app > config
exports.secret = function (app) {
    if (typeof process.env.KSAPI_SECRET !== 'undefined') {
        return process.env.KSAPI_SECRET;
    }
    else if (typeof app !== 'undefined') {
        return app.get('config').security.default_secret;
    }
    return false;
}


exports.crypt = function (plain, algo, secret) {
    if (!exports.defined([plain, algo, secret]) || !secret) { return false; }
    var cipher = crypto.createCipher(algo, secret);
    var crypted = cipher.update(plain, 'utf-8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

exports.decrypt = function (crypted, algo, secret) {
    if (!exports.defined([crypted, algo, secret]) || !secret) { return false; }
    var decipher = crypto.createDecipher(algo, secret);
    var decrypted = decipher.update(crypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}


/**
 * sort functions
 */
exports.compareScore = function compareScore(a, b) {
    return b.score - a.score;
}
