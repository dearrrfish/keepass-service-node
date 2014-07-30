
/*
 * Module Dependencies
 */
var express = require('express');

/*
 * Factory of API router
 */
function API(app)
{
    var api = express.Router();
    api.get('/', function(req, res) {
        res.render('index', { title: app.get('env') + ' API homepage' });
    });

    return api;
}

module.exports = API;
