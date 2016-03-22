module.exports = function(io) {
  var http = require('http');
  var MongoClient = require('mongodb').MongoClient;
  var assert = require('assert');
  var ObjectId = require('mongodb').ObjectID;
  var mongoURL = 'mongodb://localhost:27017/tweets';
  var fs = require('fs');
  var http = require('http');
  var url = require('url') ;
  var util = require("util");

  //Lets define a port we want to listen to
  const PORT=4040;
  var itemsProcessed = 0;
  var total =0;
  var queryData;
  const COLLECTION = 'tweets';


  var app = require('express');
  var router = app.Router();

        /* GET home page. */
        router.get('/', function(req, res, next) {
          queryData = url.parse(req.url, true).query;
          res.render('map', { title: 'Express' });
        });


        // Emit welcome message on connection
        io.on('connection', function(socket) {
            // Use socket to communicate with this particular client only, sending it it's own id
            MongoClient.connect(mongoURL, function(err, db) {
              db.collection(COLLECTION).count(function(err, count){
                socket.emit('welcome', { message: 'Welcome! '+count+' tweets tracked', id: socket.id });
              });
            });
            start();

        });

        function start(){
          console.log("starting");
          MongoClient.connect(mongoURL, function(err, db) {
            assert.equal(null, err);
            console.log(JSON.stringify(queryData));
            if(queryData){
              if(queryData.page =="stream"){
                console.log("starting stream");
                findTweetsStream(db);
              }
              else if(queryData.page =="data"){
                console.log("starting stats");
                showStats(db);
              }
            }
          });
        }

        var showStats = function(db) {
          var html = '';
          db.collection(COLLECTION).count(function(err, count){
            io.emit('data', count);
            db.stats(function(err, stats){
              io.emit('data', stats);
              db.close();
            });
          });
        };

        var findTweetsStream = function(db, callback,res) {

           var cursor =db.collection(COLLECTION).find({geo:{$ne:null }});
          // var html = '<h2> Results '+queryData.search+' </h2>';
           var counter=0;
           cursor.on('data', function(tweet) {
             if (tweet != null) {
               var tweettext = tweet.text.toLowerCase();
               console.log(tweettext);
               //var data = { cord : tweet.geo.coordinates , eu : 'i' };
               //io.emit('time', data);

                 var data = { cord : tweet.geo.coordinates , eu : 'x' };
                 io.emit('time', data);


               if(tweettext.indexOf('brexit')>0){
                 data = { cord : tweet.geo.coordinates , eu : 'o' };
                 io.emit('time', data);

               }
               if(tweettext.indexOf('bremain')>0){
                 data = { cord : tweet.geo.coordinates , eu : 'i' };
                 io.emit('time', data);

               }


                console.log(counter++);

              }
            });

            cursor.once('end', function() {
              db.close();
            });
        };

        return router;
}
