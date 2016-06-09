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

  var tweettools = require('./tools/TweetToNeo');

  var client = new Twitter({
    consumer_key: 'zSN8z9oDC5xG7Ticl3pnPHtKi',
    consumer_secret: 'Pg06j6wIiC3pdRhhbAUI3gOaDni3jXHMUMo79mF5IymZ2FKHh4',
    access_token_key: '14812487-06dGq8Lr1VkKZS21iuuZ0tr36tg5oi9yycWFcjpnV',
    access_token_secret: 'fFFOlemWQbnS7n56rtppDLR0TCy4zrrgmheL81abj6vA2',
  });

  const leaveTags = ['brexit','no2eu','notoeu','betteroffout','voteout','britainout','leaveeu','voteleave','beleave'];
  const remainTags = ['bremain','yes2eu','yestoeu','betteroffin','votein','ukineu','strongerin','leadnotleave','voteremain'];
  //Lets define a port we want to listen to
  const PORT=4040;
  var itemsProcessed = 0;
  var total =0;
  var queryData;
  //const COLLECTION = 'holyrood16';
  const COLLECTION = 'euref';

  var app = require('express');
  var router = app.Router();
  var pagetype;

  var leaveC =0;
  var remainC =0;



        /* GET home page. */
        router.get('/', function(req, res, next) {
          pagetype = "map";
          queryData = url.parse(req.url, true).query;
          res.render('eumap', { title: 'Eu Referndum Tweets' });
        });

        /* GET graphs page. */
        router.get('/graphs', function(req, res, next) {
          pagetype="graph";
          queryData = url.parse(req.url, true).query;
          res.render('graphs', { title: 'Holyrood16 Tweet Graphs' });
        });

        /* GET single page. */
        router.get('/single', function(req, res, next) {
          pagetype="graph";
          queryData = url.parse(req.url, true).query;
          res.render('single', { title: 'Holyrood16 Tweet Graphs' });
        });
        /* GET reatime page. */
        router.get('/realtime', function(req, res, next) {
          pagetype="graph";
          queryData = url.parse(req.url, true).query;
          res.render('realtime', { title: 'Holyrood16 Tweet Graphs' });
        });

        /* GET reatime page. */
        router.get('/liveNetwork', function(req, res, next) {
          pagetype="graph";
          queryData = url.parse(req.url, true).query;
          res.render('NeoNetwork', { title: 'Live Network' });
        });

        /* GET reatime page. */
        router.get('/stats', function(req, res, next) {
          pagetype="graph";
          queryData = url.parse(req.url, true).query;
          // connect to mongo
          var count;
          MongoClient.connect(mongoURL, function(err, db) {
            //eucounts only has one entry so we can just use find.
            db.collection('eucounts').find({}).toArray(function(err, docs) {
              count = docs[0];
            }

          }
          res.render('realtime', { title: 'Holyrood16 Tweet Graphs', data:count });
        });

        /* GET pie charts pages page. */
        // router.get('/pies', function(req, res, next) {
        //   pagetype="pies";
        //   queryData = url.parse(req.url, true).query;
        //   MongoClient.connect(mongoURL, function(err, db) {
        //     db.collection('debatecounts').find({}).toArray(function(err, docs) {
        //       var returnVal = {'count':{'snp':snpc,'lab':labc,'lib':libc,'gre':grec,'tor':torc,'uki':ukic}};
        //
        //       var dataset = [
        //         {label:'snp',count:returnVal.count['snp']},
        //         {label:'lab',count:returnVal.count['lab']},
        //         {label:'lib',count:returnVal.count['lib']},
        //         {label:'gre',count:returnVal.count['gre']},
        //         {label:'tor',count:returnVal.count['tor']},
        //         {label:'uki',count:returnVal.count['uki']}
        //       ];
        //
        //       res.render('pies', { data: dataset});
        //       db.close();
        //     });
        //   });
        //
        //
        // });


        // Emit welcome message on connection
        io.on('connection', function(socket) {
            // Use socket to communicate with this particular client only, sending it it's own id
            MongoClient.connect(mongoURL, function(err, db) {
              db.collection(COLLECTION).count(function(err, count){
                socket.emit('welcome', { message: 'Currently '+count+' tweets tracked', id: socket.id });
              });
            });
            if(pagetype=="graph"){
              //startgraph();
            }
            else{
              startmap();
            }


        });


        //io.on('graphready', function(socket) {
            // Use socket to communicate with this particular client only, sending it it's own id
          //  startgraph();

        //});

        //io.on('mapready', function(socket) {
            // Use socket to communicate with this particular client only, sending it it's own id
          //  startmap();

        //});

        //starts a stream from mongo
        function startgraph(){
          console.log("startinggraph");
          MongoClient.connect(mongoURL, function(err, db) {
            assert.equal(null, err);
            findAllTweetsStream(db);
          });
        }

        function startmap(){
          console.log("startingmap");
          MongoClient.connect(mongoURL, function(err, db) {
            assert.equal(null, err);
            if(queryData){
              if(queryData.page =="data"){
                   console.log("starting stats");
                   showStats(db);
              }
              else{
                console.log("starting stream");
                findTweetsStream(db);
              }
            }

          });
        }

        //emits mongo stats
        var showStats = function(db) {
          var html = '';
          db.collection(COLLECTION).count(function(err, count){
            io.emit('eudata', count);
            db.stats(function(err, stats){
              io.emit('eudata', stats);
              db.close();
            });
          });
        };

        //finds all tweets in the mongodb and starts a stream
        var findAllTweetsStream = function(db, callback,res) {
          //cursor for everything in the mongo db
           var cursor =db.collection(COLLECTION).find();
           //cursor acts as async stream, so each bit of data comes down as its own object
           cursor.on('data', function(tweet) {


            });

            cursor.once('end', function() {
              db.close();
            });

        };

        var tweetSearch = function(string, strings){
          for(var i=0; i<strings.length;i++) {
              if(string.indexOf(strings[i])>0){
                //console.log(entry);
                return true;
              }
              return false;
            };
        }

        //filtered tweet stream
        var findTweetsStream = function(db, callback,res) {
          //return a cursof of tweets where location (geo) is not equal (ne) to null
           var cursor =db.collection(COLLECTION).find({geo:{$ne:null }});

           var counter=0;
           //again async stream through mongo data
           cursor.on('data', function(tweet) {
             if (tweet != null) {
              //console.log("tweet");
               var tweettext = tweet.text.toLowerCase();
               var data = "";

               data = { cord : tweet.geo.coordinates , ineu : 'false', outeu :'false'};
               io.emit('eugeo', data);

               if(tweetSearch(tweettext, remainTags)){
                 data = { cord : tweet.geo.coordinates , ineu : 'true'};
                 io.emit('eugeo', data);
               }
               if(tweetSearch(tweettext, leaveTags)){
                 data = { cord : tweet.geo.coordinates , outeu : 'true'};
                 io.emit('eugeo', data);
               }
              }
            });

            cursor.once('end', function() {
              db.close();
            });

        };


        //twitter client streaming for live data, this could be loads more efficient.
        //twitscraper.js is doing this anyway, but afaik there is no way of adding listeners to mongo
        client.stream('statuses/filter', {track: 'eureferendum,euref,brexit,no2eu,notoeu,betteroffout,voteout,britainout,leaveeu,voteleave,beleave,leaveeu,yes2eu,yestoeu,betteroffin,votein,ukineu,bremain,strongerin,leadnotleave,voteremain'},  function(stream){

          stream.on('data', function(tweet) {
            //console.log(tweet);
            tweettools.processTweet(tweet, io);
          });

          stream.on('error', function(error) {
            console.log(error);
            io.emit('error',error);
          });
        });

        var insertDocument = function(db, newtweet, callback) {
           db.collection(COLLECTION).insertOne( newtweet, function(err, result) {
            assert.equal(err, null);
            //console.log("Inserted a document into the tweets collection.");
            callback();
          });
        };



        return router;
};
