/**
 * Dependencies
 */
var crypto = require('crypto'),
    errors = require('./errors');

exports.query_fields = {
    t        : 'title',
    title    : 'title',
    g        : 'group',
    grp      : 'group',
    group    : 'group',
    p        : 'path',
    path     : 'path',
    l        : 'url',
    link     : 'url',
    url      : 'url',
    a        : 'user',
    account  : 'user',
    u        : 'user',
    user     : 'user',
    username : 'user',
    n        : 'notes',
    note     : 'notes',
    notes    : 'notes'
}

exports.err = errors;

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
 * return {object} queries - array of query objects
 */
exports.queries = function (qs) {
    var queries = {};
    qs.split(/\s+/).forEach(function (q) {
        if (q === '') { return; }
        var colonIndex = q.indexOf(':');
        // default to search in all available fields
        if (colonIndex <= 0) {
            exports.pushInObject(q, 'all', queries);
            return;
        }

        var field = q.slice(0,colonIndex).toLowerCase(),
            content = q.slice(colonIndex +1);

        // search  is empty
        if (content === '') { return; }

        if (field in exports.query_fields) {
            exports.pushInObject(content, exports.query_fields[field], queries)
        }
    });

    return queries;
}

//  Response generator
exports.res = function response(success, returns)
{
    var res = {};
    if (success) { res.status = 'OK'; res.data = returns; }
    else {
        res.status = 'KO';
        if (exports.isArray(returns)) {
            res.error = errors[returns[0]];
            res.extra = returns.slice(1);
        }
        else {
            res.error = errors[returns];
        }
    }
    return res;
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
        if (exports.has(o, key) && o[key])
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
    for (var key in b) {
        if (exports.has(b, key) && exports.isDefined(b[key])) {
            if ('object' === typeof b[key] && !exports.isArray(b[key])) {
                if (!exports.isDefined(a[key])) { a[key] = {}; }
                exports.merge(a[key], b[key]);
            }
            else {
                a[key] = b[key];
            }
        }
    }
    return a;
}

/**
 *  Full `a` with `b`
 */
exports.full = function full(a, b) {
    for (var key in b) {
        if (!exports.has(a, key) && exports.has(b, key) && exports.isDefined(b[key])) {
            a[key] = b[key];
        }
    }
    return a;
}

/**
 * push item into array(may not exist) in an object
 */
exports.pushInObject = function pushInObject(item, arr, object) {
    if (!exports.has(object, arr)) { object[arr] = []; }
    if (!exports.isArray(object[arr])) { return false; }
    object[arr].push(item);
    return true;
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

// Return user home path.
exports.home = function() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

// Check if variable(s) is defined.
exports.isDefined = function (vars) {
    if (typeof vars === 'undefined') { return false; }
    if (exports.isArray(vars)) {
        return vars.every(function (v) { return exports.isDefined(v); });
    }
    return true;
}

// Check if a object is Function Type.
exports.isFunction = function(func) {
  return func && typeof(func) === 'function';
}

// Check if a object is Array Type.
exports.isArray = function isArray(arr)
{
    return arr && Array.isArray(arr);
}

// Check object/array has properties/elements
exports.has = function (obj, props) {
    if (exports.isArray(props)) {
        return props.every(function (prop) {
            return exports.has(obj, prop);
        });
    }
    else if (exports.isArray(obj)) {
        return obj.indexOf(props) >= 0;
    }
    else {
        return Object.prototype.hasOwnProperty.call(obj, props);
    }
}

// Check if empty object/array
exports.empty = function (obj) {
    return (exports.isArray(obj)) ? obj.length == 0 : Object.keys(obj).length == 0;
}


// URL encode/decode, compatiable with PHP urlencode()/urldecode()
exports.urlencode = function (str) {
    return encodeURIComponent((str+'').toString())
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A')
            .replace(/%20/g, '+');
}

exports.urldecode = function (str) {
    return decodeURIComponent((str + '')
            .replace(/%(?![\da-f]{2})/gi, function() { return '%25'; })
            .replace(/\+/g, '%20'));
}

