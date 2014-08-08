var express = require('express');
var router = express.Router();
var utils = require('../modules/utils');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/up', function(req, res) {
    res.send(utils.res(true, 'ksapi is running'));
});

module.exports = router;
