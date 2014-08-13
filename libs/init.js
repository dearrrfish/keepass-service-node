
/*
 * Module Dependencies
 */
var express      = require('express'),
    log          = require('debug')('ksapi:init'),
    logger       = require('morgan'),
    path         = require('path'),
    favicon      = require('static-favicon'),
    cookieParser = require('cookie-parser'),
    bodyParser   = require('body-parser'),
    utils        = require('./utils');

var config   = {};  // Default config object

/*
 * Module exports
 */
module.exports = init;

/*
 * Initialize application
 *
 * @param {Express} app - `Express` application instance
 */
function init(app)
{
    // default settings
    var config = require('../config/default.json');

    // try to fetch user preferences
    try
    {
        var user_config = require('../config/user.json');
        log('Loaded user settings from user.json %j', user_config);
    }
    catch (err)
    {
        log('Unable to load user.json %j', err);
    }

    // merge settings
    config = utils.merge(config, user_config);
    // replace some env marks with values
    utils.replace(config, "[[HOME]]", process.env.HOME);

    // save settings in app
    app.set('config', config);
    log(JSON.stringify(config));
    // app configurations
    app.set('port', config.app.port);

    app.set('env', config.app.env);

    log(app.get('config'));

    // view engine setup
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'jade');

    app.use(favicon());
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    /*
     * Routes setups
     */
    // api routes
    var api = require('../routes/api')(app);

    // apply routes
    app.use('/api', api);

}
