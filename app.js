var express = require('express');
var socket_io    = require( "socket.io" );
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var tweetscraper = require('./routes/tools/twitscraperTool');
//var tagcounter = require('./counter');
//var eu = require('./routes/eu');


// Express
var app          = express();

// Socket.io
var io           = socket_io();
app.io           = io;


var routes = require('./routes/index');
//var holy16 = require('./routes/holy16')(io);
var eu = require('./routes/eu')(io);
var eus = require('./routes/eus')(io);
//var network = require('./routes/network')(io);
var users = require('./routes/users');

//tagcounter.startCount(io);
tweetscraper.startScraping(io);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static('public'));
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/eu', eu);
app.use('/eus', eus);
//app.use('/holy16', holy16);
//app.use('/net', network);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

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
