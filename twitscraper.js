var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongoURL = 'mongodb://localhost:27017/tweets';
var Twitter = require('twitter');
var counter = 0;

var client = new Twitter({
  consumer_key: 'hhZTif85m9t7Q9aqEUSRxdSwI',
  consumer_secret: 'vnqq3G2hG887KZyeLa0wXkmN19Bn4N8a3CGAf16MBN8TVBeEcQ',
  access_token_key: '14812487-BzawCSPGaNdrJvoa1VrtJ3DbMFgr7nMiAV3x21rzX',
  access_token_secret: 'JqfvcFqBTMYS5RbFeTJ0ai37BEd1QRTZ7npe14bB06TZo',
});
//console.log(consumer_key +" : "+ consumer_secret +" : "+ access_token_key +" : "+ z)
/**
 * Stream statuses filtered by keyword
 * number of tweets per second depends on topic popularity
 **/

client.stream('statuses/filter', {track: 'eureferendum,euref,brexit,no2eu,notoeu,betteroffout,voteout,britainout,leaveeu,voteleave,beleave,leaveeu,yes2eu,yestoeu,betteroffin,votein,ukineu,bremain,strongerin,leadnotleave,voteremain'},  function(stream){

  stream.on('data', function(tweet) {
    MongoClient.connect(mongoURL, function(err, db) {
      assert.equal(null, err);
      insertDocument(db,tweet, function() {
        db.close();
      });
    });
    var tweettext = tweet.text.toLowerCase();
    if(tweetSearch(tweettext, leaveTags)){
      tweet.voteout = 'true'
      MongoClient.connect(mongoURL, function(err, db) {
        assert.equal(null, err);
          updateCount(db,'out', function() {
            db.close();
          });
        });
    }
    if(tweetSearch(tweettext, remainTags)){
      tweet.votein = 'true'
      MongoClient.connect(mongoURL, function(err, db) {
        assert.equal(null, err);
          updateCount(db,'in', function() {
            db.close();
          });
        });
    }
  });

  stream.on('error', function(error) {
    console.log(error);
  });
});
const leaveTags = ['brexit','no2eu','notoeu','betteroffout','voteout','britainout','leaveeu','voteleave','beleave'];
const remainTags = ['bremain','yes2eu','yestoeu','betteroffin','votein','ukineu','strongerin','leadnotleave','voteremain'];


var tweetSearch = function(string, strings){
  for(var i=0; i<strings.length;i++) {
      if(string.indexOf(strings[i])>0){
        //console.log(entry);
        return true;
      }
      return false;
    };
}

var updateCount = function (db,inout,callback){
  if(inout == 'in'){
    db.collection('eucounts').update({},{$inc:{"count.in":1}},function(err, result){
      assert.equal(err, null);
      //console.log("In");
      callback();
    });
  }
  if(inout == 'out'){
    db.collection('eucounts').update({},{$inc:{"count.out":1}},function(err, result){
      assert.equal(err, null);
      //console.log("Out");
      callback();
    });
  }
}

var insertDocument = function(db, newtweet, callback) {
    db.collection('euref').insertOne( newtweet, function(err, result) {
      assert.equal(err, null);
      //console.log("Inserted a document into the tweets collection.");
      callback();
    });
};
