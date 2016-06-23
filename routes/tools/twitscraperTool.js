var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongoURL = 'mongodb://localhost:27017/tweets';
var Twitter = require('twitter');
var tweettools = require('./TweetToNeo');
var counter = 0;

var mongoDB;

MongoClient.connect(mongoURL, function (err, db) {
  if (err) {
    console.error(err);
    process.exit(-1);
  }

  mongoDB = db;
});

var client = new Twitter({
  consumer_key: 'hhZTif85m9t7Q9aqEUSRxdSwI',
  consumer_secret: 'vnqq3G2hG887KZyeLa0wXkmN19Bn4N8a3CGAf16MBN8TVBeEcQ',
  access_token_key: '14812487-BzawCSPGaNdrJvoa1VrtJ3DbMFgr7nMiAV3x21rzX',
  access_token_secret: 'JqfvcFqBTMYS5RbFeTJ0ai37BEd1QRTZ7npe14bB06TZo',
});

const COLLECTION = 'euref';

module.exports = {
  startScraping: function (io) {
    //console.log(consumer_key +" : "+ consumer_secret +" : "+ access_token_key +" : "+ z)
    /**
     * Stream statuses filtered by keyword
     * number of tweets per second depends on topic popularity
     **/

    client.stream('statuses/filter', { track: 'eureferendum,euref,brexit,no2eu,notoeu,betteroffout,voteout,britainout,leaveeu,voteleave,beleave,leaveeu,yes2eu,yestoeu,betteroffin,votein,ukineu,bremain,strongerin,leadnotleave,voteremain' }, function (stream) {

      stream.on('data', function (tweet) {
        tweettools.processTweet(tweet, io);
        var geodata;
        var tweettext = tweet.text.toLowerCase();
        if (tweetSearch(tweettext, remainTags)) {
          io.emit('tweet', { tweet: tweet.user.name, vote: 'stay' });
          if (tweet.geo != null) {
            data = { cord: tweet.geo.coordinates, ineu: 'true' };
            io.emit('eugeo', data);
          }
          //stayc++;
        }
        if (tweetSearch(tweettext, leaveTags)) {
          io.emit('tweet', { tweet: tweet.user.name, vote: 'leave' });
          if (tweet.geo != null) {
            data = { cord: tweet.geo.coordinates, outeu: 'true' };
            io.emit('eugeo', data);
          }
          //leavec++;
        }


        //add tweet to mongo
        insertDocument(mongoDB, tweet, function () {
          //incrementout totals
          incrementCount(mongoDB, tweet, function () {
            //emit all the stats and close
            emitStatsCount(mongoDB, tweet, function () {

            });
          });





        });
      });

      stream.on('error', function (error) {
        console.log(error);
      });
    });
    const leaveTags = ['brexit', 'no2eu', 'notoeu', 'betteroffout', 'voteout', 'britainout', 'leaveeu', 'voteleave', 'beleave'];
    const remainTags = ['bremain', 'yes2eu', 'yestoeu', 'betteroffin', 'votein', 'ukineu', 'strongerin', 'leadnotleave', 'voteremain'];


    var tweetSearch = function (string, strings) {
      for (var i = 0; i < strings.length; i++) {
        if (string.indexOf(strings[i]) > 0) {
          //console.log(entry);
          return true;
        }
      };
      return false;
    }

    var insertDocument = function (db, newtweet, callback) {
      db.collection(COLLECTION).insertOne(newtweet, function (err, result) {
        assert.equal(err, null);
        //console.log("Inserted a document into the tweets collection.");
        callback();
      });
    };

    var incrementCount = function (db, tweet, callback) {
      var countin = 0;
      var countout = 0;
      if (tweet != null && tweet.text != null) {

        var tweettext = tweet.text.toLowerCase();

        var tags = [
          'bremain',
          'yes2eu',
          'yestoeu',
          'betteroffin',
          'votein',
          'ukineu',
          'strongerin',
          'leadnotleave',
          'voteremain',
          'brexit',
          'no2eu',
          'notoeu',
          'betteroffout',
          'voteout',
          'britainout',
          'voteleave',
          'beleave',
          'leaveeu'
        ];
        var tagcounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


        for (var idx = 0; idx < tags.length; idx++) {
          if (tweettext.indexOf(tags[idx]) > 0) {
            tagcounts[idx] = 1;
          }
        }
        if (tweetSearch(tweettext, leaveTags)) {
          countout = 1;
        }
        if (tweetSearch(tweettext, remainTags)) {
          countin = 1;
        }
        db.collection('eucounts').update({},
          {
            $inc: {
              "count.in": countin,
              "count.out": countout,
              "bremain": tagcounts[0],
              "yes2eu": tagcounts[1],
              "yestoeu": tagcounts[2],
              "betteroffin": tagcounts[3],
              "votein": tagcounts[4],
              "ukineu": tagcounts[5],
              "strongerin": tagcounts[6],
              "leadnotleave": tagcounts[7],
              "voteremain": tagcounts[8],
              "brexit": tagcounts[9],
              "no2eu": tagcounts[10],
              "notoeu": tagcounts[11],
              "betteroffout": tagcounts[12],
              "voteout": tagcounts[13],
              "britainout": tagcounts[14],
              "voteleave": tagcounts[15],
              "beleave": tagcounts[16],
              "leaveeu": tagcounts[17]
            }
          }, function (err, result) {
            assert.equal(err, null);
            emitCount(db, function () {
              callback();
            });
          });
      }
    }
    var emitCount = function (db, callback) {
      db.collection('eucounts').find({}).toArray(function (err, docs) {
        assert.equal(err, null);
        var inoutcount = docs[0];
        //console.log("emiting.");
        io.emit('status',
          {
            incount: inoutcount.in,
            outcount: inoutcount.out,
            allcounts: inoutcount
          });
        callback();
      });
    }

    var emitStatsCount = function (db, tweet, callback) {
      db.collection(COLLECTION).count(function (err, count) {
        assert.equal(err, null);
        io.emit('welcome',
          {
            count: count,
            tweet: tweet.text,
            time: tweet.created_at,
            message: '<p>Currently ' + count + ' tweets tracked</p>' +
            '<p>Last Tweet :' + tweet.text + '</p>' +
            '<p>@' + tweet.created_at + '</p>'
          });
        callback();
      });
    }



  }
};
