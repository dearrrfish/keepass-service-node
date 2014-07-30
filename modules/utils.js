/**
 * Dependencies
 */
var errors = require('./errors');

/**
 * Error code/message getter
 */
exports.errs = function errs(err, _errs)
{
    var errs = (typeof err !== 'undefined')
             ? [{ code: errors.code[err], message: errors.message[errors.code[err]] }] : [];

    return (typeof _errs !== 'undefined') ? errs.concat(_errs) : errs;
}

/**
 * Response generator
 */
exports.res = function response(status, data, ext)
{
    return (!status || status == 'KO') ? { status: 'KO', errors: errs(data, ext) }
                                       : { status: 'OK', data: data };
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
        if (exports.has.call(b, key) && b[key])
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

