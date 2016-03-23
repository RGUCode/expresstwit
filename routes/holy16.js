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
  var Twitter = require('twitter');
  var counter = 0;

  var client = new Twitter({
    consumer_key: 'zSN8z9oDC5xG7Ticl3pnPHtKi',
    consumer_secret: 'Pg06j6wIiC3pdRhhbAUI3gOaDni3jXHMUMo79mF5IymZ2FKHh4',
    access_token_key: '14812487-06dGq8Lr1VkKZS21iuuZ0tr36tg5oi9yycWFcjpnV',
    access_token_secret: 'fFFOlemWQbnS7n56rtppDLR0TCy4zrrgmheL81abj6vA2',
  });

  //Lets define a port we want to listen to
  const PORT=4040;
  var itemsProcessed = 0;
  var total =0;
  var queryData;
  const COLLECTION = 'holyrood16';


  var app = require('express');
  var router = app.Router();

        /* GET home page. */
        router.get('/', function(req, res, next) {
          queryData = url.parse(req.url, true).query;
          res.render('mapholy', { title: 'Holyrood16 Tweets' });
        });

        /* GET home page. */
        router.get('/graphs', function(req, res, next) {
          queryData = url.parse(req.url, true).query;
          res.render('graphs', { title: 'Holyrood16 Tweet Graphs' });
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
            // if(queryData){
            //   if(queryData.page =="stream"){
            //     console.log("starting stream");
                findTweetsStream(db);
            //   }
            //   else if(queryData.page =="data"){
            //     console.log("starting stats");
            //     showStats(db);
            //   }
            // }
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

           //var cursor =db.collection(COLLECTION).find({geo:{$ne:null }});
           var cursor =db.collection(COLLECTION).find();
          // var html = '<h2> Results '+queryData.search+' </h2>';
           var counter=0;
           cursor.on('data', function(tweet) {
             if (tweet != null) {
               var tweettext = tweet.text.toLowerCase();
               //console.log(tweettext);
               //var data = { cord : tweet.geo.coordinates , eu : 'i' };
               //io.emit('time', data);
              if(tweet.geo != null){
                 var data = { cord : tweet.geo.coordinates , eu : 'x' };
                 io.emit('geo', data);
               }
                 io.emit('tweet',tweet);
                 //console.log(counter++);

              }
            });

            cursor.once('end', function() {
              db.close();
            });

        };
        client.stream('statuses/filter', {track: 'leadersdebate,holyrood16,holyrood2016,sp16,scotland16'},  function(stream){

          stream.on('data', function(tweet) {
            io.emit('tweet', tweet);
            MongoClient.connect(mongoURL, function(err, db) {
              assert.equal(null, err);
              insertDocument(db,tweet, function() {
                db.close();
              });
            });
          });

          stream.on('error', function(error) {
            console.log(error);
          });
        });

        var insertDocument = function(db, newtweet, callback) {
           db.collection('holyrood16').insertOne( newtweet, function(err, result) {
            assert.equal(err, null);
            console.log("Inserted a document into the tweets collection.");
            callback();
          });
        };


        return router;
};
