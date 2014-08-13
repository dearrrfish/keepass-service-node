
module.exports = {
    // default error
    UNKNOWN_ERROR             : "unknown error",
    INVALID_SECRET            : "incorrect secret provided",

    // db errors
    DB_FILE_NOT_EXIST         : "db file doesn't exist",
    DB_INVALID_SETTINGS       : "db settings error",
    DB_FILE_READ_ERROR        : "db read error",
    DB_CACHE_NOT_EXIST        : "db cache doesn't exist",
    DB_CACHE_UDPATE_ERROR     : "db cache update failed",
    DB_CONFIG_NOT_EXIST       : "db config doesn't exist",

    // cache errors
    CACHE_NOT_EXIST           : "cache doesn't exist",
    CACHE_READ_ERROR          : "cache read error",
    CACHE_BAD_JSON            : "cache bad json",

    // search errors
    SEARCH_ERROR              : "search unknown error",

    // getters errors
    GET_ENTRY_NOT_EXIST       : "get entry doesn't exist",
    GET_PASSWORD_ERROR        : "get password failed",

    // pm2 errors
    PM2_CONNECT_ERROR         : "pm2 connect or launch failed",
    PM2_DISCONNECT_ERROR      : "pm2 disconnect failed",
    PM2_LIST_ERROR            : "pm2 list processes failed",
    PM2_RELOAD_ERROR          : "pm2 reload processes failed",
    PM2_GRACEFUL_RELOAD_ERROR : "pm2 graceful reload processes failed",
    PM2_KILL_ERROR            : "pm2 kill daemon failed",
    PM2_START_ERROR           : "pm2 start process failed",
    PM2_DESCRIBE_ERROR        : "pm2 describe process failed"
};
