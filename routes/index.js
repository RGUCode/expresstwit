var express = require('express');
var router = express.Router();
var io = router.io;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

io.on('connection', function(socket) {

});

module.exports = function(io) {
    var app = require('express');
    var router = app.Router();
    this.io = io;


    return router;
};
