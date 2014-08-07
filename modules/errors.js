
exports.code = {
    // db errors
    DB_FILE_NOT_EXIST : 100,
    DB_INVALID_SETTINGS : 101,
    DB_FILE_READ_ERROR : 102,

    // cache errors
    CACHE_NOT_EXIST: 200,
    CACHE_READ_ERROR: 201,
    CACHE_BAD_JSON: 202,

    // search errors
    SEARCH_ERROR: 300
};

exports.message = {
    // db errors
    100 : "file doesn't exist (path/keyfile)",
    101 : "missing mandatory db settings (path/password/keyfile)",
    102 : "errors occurred when reading db file",

    // cache errors
    200 : "cache doesn't exist",
    201 : "errors occurred when reading cache",
    202 : "bad json format in cache",

    // search errors
    300 : "unknown search error"
}

