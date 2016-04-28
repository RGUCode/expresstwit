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
  //const COLLECTION = 'holyrood16';
  const COLLECTION = 'holyrood16Leaders1';

  var app = require('express');
  var router = app.Router();
  var pagetype;

  var snpc =0;
  var labc =0;
  var libc =0;
  var grec =0;
  var ukic =0;
  var torc =0;


        /* GET home page. */
        router.get('/', function(req, res, next) {
          pagetype = "map";
          queryData = url.parse(req.url, true).query;
          res.render('mapholy', { title: 'Holyrood16 Tweets' });
        });

        /* GET home page. */
        router.get('/graphs', function(req, res, next) {
          pagetype="graph";
          queryData = url.parse(req.url, true).query;
          res.render('graphs', { title: 'Holyrood16 Tweet Graphs' });
        });

        /* GET home page. */
        router.get('/single', function(req, res, next) {
          pagetype="graph";
          queryData = url.parse(req.url, true).query;
          res.render('single', { title: 'Holyrood16 Tweet Graphs' });
        });
        /* GET home page. */
        router.get('/realtime', function(req, res, next) {
          pagetype="graph";
          queryData = url.parse(req.url, true).query;
          res.render('realtime', { title: 'Holyrood16 Tweet Graphs' });
        });

        /* GET home page. */
        router.get('/pies', function(req, res, next) {
          pagetype="pies";
          queryData = url.parse(req.url, true).query;
          MongoClient.connect(mongoURL, function(err, db) {
            db.collection('debatecounts').find({}).toArray(function(err, docs) {
              var returnVal = {'count':{'snp':0,'lab':0,'lib':0,'gre':0,'tor':0,'uki':0}};
              console.log(returnVal.count['snp']);
              console.log(docs[0]);
              for (var i = 0; i<docs.length; i++){

                returnVal.count['snp'] +=docs.count['snp'];
                returnVal.count.lab +=docs.count.lab;
                returnVal.count.lib +=docs.count.lib;
                returnVal.count.gre +=docs.count.gre;
                returnVal.count.tor +=docs.count.tor;
                returnVal.count.uki +=docs.count.uki;

              }
              res.render('pies', { data: returnVal });
              db.close();
            });
          });


        });


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

        var findAllTweetsStream = function(db, callback,res) {

           //var cursor =db.collection(COLLECTION).find({geo:{$ne:null }});
           var cursor =db.collection(COLLECTION).find();
          // var html = '<h2> Results '+queryData.search+' </h2>';

           cursor.on('data', function(tweet) {
             if (tweet != null) {
               var tweettext = tweet.text.toLowerCase();
               //console.log(tweettext);
               //var data = { cord : tweet.geo.coordinates , eu : 'i' };
               //io.emit('time', data);
               if(tweettext.indexOf('snp')>0 || tweettext.indexOf('sturgeon')>0){
                 io.emit('tweet', {tweet:tweet.user.name, party : 'snp' });
               }
               if(tweettext.indexOf('tories')>0 || tweettext.indexOf('davidson')>0){
                 io.emit('tweet', {tweet:tweet.user.name, party : 'tor' });
               }
               if(tweettext.indexOf('labour')>0 || tweettext.indexOf('dugdale')>0){
                 io.emit('tweet', {tweet:tweet.user.name, party : 'lab' });
               }
               if(tweettext.indexOf('libdem')>0 || tweettext.indexOf('rennie')>0){
                 io.emit('tweet', {tweet:tweet.user.name, party : 'lib' });
               }
               if(tweettext.indexOf('green')>0 || tweettext.indexOf('harvie')>0){
                 io.emit('tweet', {tweet:tweet.user.name, party : 'gre' });
               }
               if(tweettext.indexOf('ukip')>0 || tweettext.indexOf('coburn')>0){
                 io.emit('tweet', {tweet:tweet.user.name, party : 'uki' });
               }
               //io.emit('tweet', tweet.user.name);
              }
            });

            cursor.once('end', function() {
              db.close();
            });

        };
        var findTweetsStream = function(db, callback,res) {

           var cursor =db.collection(COLLECTION).find({geo:{$ne:null }});
           //var cursor =db.collection(COLLECTION).find();
          // var html = '<h2> Results '+queryData.search+' </h2>';
           var counter=0;
           cursor.on('data', function(tweet) {
             if (tweet != null) {
               var tweettext = tweet.text.toLowerCase();
               //console.log(tweettext);
               //var data = { cord : tweet.geo.coordinates , eu : 'i' };
               //io.emit('time', data);
               var data = "";
               if(tweettext.indexOf('snp')>0 || tweettext.indexOf('sturgeon')>0){
                 data = { cord : tweet.geo.coordinates , party : 'snp' };
                 io.emit('geo', data);
               }
               if(tweettext.indexOf('tories')>0 || tweettext.indexOf('davidson')>0){
                 data = { cord : tweet.geo.coordinates , party : 'tor' };
                 io.emit('geo', data);
               }
               if(tweettext.indexOf('labour')>0 || tweettext.indexOf('dugdale')>0){
                 data = { cord : tweet.geo.coordinates , party : 'lab' };
                 io.emit('geo', data);
               }
               if(tweettext.indexOf('libdem')>0 || tweettext.indexOf('rennie')>0){
                 data = { cord : tweet.geo.coordinates , party : 'lib' };
                 io.emit('geo', data);
               }
               if(tweettext.indexOf('green')>0 || tweettext.indexOf('harvie')>0){
                 data = { cord : tweet.geo.coordinates , party : 'gre' };
                 io.emit('geo', data);
               }
               if(tweettext.indexOf('ukip')>0 || tweettext.indexOf('coburn')>0){
                 data = { cord : tweet.geo.coordinates , party : 'uki' };
                 io.emit('geo', data);
               }

              //if(tweet.geo != null){
                 //var data = { cord : tweet.geo.coordinates , party : 'x' };
                 //io.emit('geo', data);
               //}
               //var tweetdata = {name: tweet.user.name}

                 //console.log(counter++);

              }
            });

            cursor.once('end', function() {
              db.close();
            });

        };
        client.stream('statuses/filter', {track: 'scotdebates,leadersdebate,holyrood16,holyrood2016,sp16,scotland16'},  function(stream){

          stream.on('data', function(tweet) {
            var geodata;
            var tweettext = tweet.text.toLowerCase();
            if(tweettext.indexOf('snp')>0 || tweettext.indexOf('sturgeon')>0){
              io.emit('tweet', {tweet:tweet.user.name, party : 'snp' });
              if(tweet.geo !=null){
                geodata = { cord : tweet.geo.coordinates , party : 'snp' };
                io.emit('geo', data);
              }
              snpc++;
            }
            if(tweettext.indexOf('tories')>0 || tweettext.indexOf('davidson')>0){
              io.emit('tweet', {tweet:tweet.user.name, party : 'tor' });
              if(tweet.geo !=null){
              geodata = { cord : tweet.geo.coordinates , party : 'tor' };
              io.emit('geo', data);
            }
              torc++;
            }
            if(tweettext.indexOf('labour')>0 || tweettext.indexOf('dugdale')>0){
              io.emit('tweet', {tweet:tweet.user.name, party : 'lab' });
              if(tweet.geo !=null){
              geodata = { cord : tweet.geo.coordinates , party : 'lab' };
              io.emit('geo', data);
            }
              labc++;
            }
            if(tweettext.indexOf('libdem')>0 || tweettext.indexOf('rennie')>0){
              io.emit('tweet', {tweet:tweet.user.name, party : 'lib' });
              if(tweet.geo !=null){
              geodata = { cord : tweet.geo.coordinates , party : 'lib' };
              io.emit('geo', data);
            }
              libc++;
            }
            if(tweettext.indexOf('green')>0 || tweettext.indexOf('harvie')>0){
              io.emit('tweet', {tweet:tweet.user.name, party : 'gre' });
              if(tweet.geo !=null){
              geodata = { cord : tweet.geo.coordinates , party : 'gre' };
              io.emit('geo', data);
            }
              grec++;
            }
            if(tweettext.indexOf('ukip')>0 || tweettext.indexOf('coburn')>0){

              io.emit('tweet', {tweet:tweet.user.name, party : 'uki' });
              if(tweet.geo !=null){
              geodata = { cord : tweet.geo.coordinates , party : 'uki' };
              io.emit('geo', data);
              }
              ukic++;
            }
            //geodata = { cord : tweet.geo.coordinates , party : 'x' };
            //io.emit('geo', data);
            MongoClient.connect(mongoURL, function(err, db) {
              assert.equal(null, err);
              db.collection(COLLECTION).count(function(err, count){
                io.emit('welcome',
                { message: '<p>Currently '+count+' tweets tracked</p>'+
                           '<p>Last Tweet :'+tweet.text+'</p>'+
                           '<p>@'+tweet.created_at+'</p>'

                });
              });
              insertCount(db);
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
           db.collection(COLLECTION).insertOne( newtweet, function(err, result) {
            assert.equal(err, null);
            //console.log("Inserted a document into the tweets collection.");
            callback();
          });
        };
        var insertCount = function(db) {
          var currentcount = {'count':{'snp':snpc, 'lab':labc, 'lib':libc, 'gre':grec,'tor':torc,'uki':ukic}};
          io.emit('count',currentcount);
           db.collection('debatecounts').insertOne(currentcount, function(err, result) {
          });
        };


        return router;
};
