
/*
 * Module Depedencies
 */
var express = require('express'),
    init = require('./init');


/*
 * Create and initialize applicaiton
 */
// express app object
var app = express();
// initialize app settings
init(app);

/*
 * Routes setups
 */
// api routes
var apis = require('./api/index')(app);

// web routes
var routes = require('./routes/index');
var users = require('./routes/users');

// apply routes
app.use('/', routes);
app.use('/users', users);

app.use('/api', apis);

/*
 * Error handlers
 */

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
