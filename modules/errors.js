
exports.code = {
    // db errors
    DB_FILE_NOT_EXIST : 100,
    DB_INVALID_SETTINGS : 101,
    DB_LOAD_FAIL : 102
};

exports.message = {
    // db errors
    100 : "file doesn't exist (path/keyfile)",
    101 : "missing mandatory db settings (path/password/keyfile)",
    102 : "errors occurred when reading db file"
}

