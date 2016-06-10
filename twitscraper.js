var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongoURL = 'mongodb://localhost:27017/tweets';
var Twitter = require('twitter');
var counter = 0;

var client = new Twitter({
  consumer_key: 'TC98w89JxQK2v4vPEqLLxJLx0',
  consumer_secret: 'le4t2JCgoT3CBZwToaKdOJx5LFYDDkGL5e3Pjl2ZtfTqYV46Fs',
  access_token_key: '4459846396-tU9aYf4E5r9eHhJnniU7OsyrLNJhzEd4cpVeFFe',
  access_token_secret: 'UaY6kpdXbdV7cAsAxrKLzFTkKSLtW8dcNTe1CYniUl6xM',
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
