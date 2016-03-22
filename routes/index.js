var express = require('express');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.io.on('connection', function(socket) {

});

module.exports = function(io) {
    var app = require('express');
    var router = app.Router();



    return router;
};
