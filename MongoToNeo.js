/**
 * Created by John on 21/07/2015.
 */
//loads in tweets in Marcos format.

var http = require('http').globalAgent.maxSockets = Infinity;;
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongoURL = 'mongodb://localhost:27017/tweets';
var fs  = require("fs"),
    request = require("request"),
    prompt = require('prompt');
var host = 'localhost',
    port = 7474;

const PORT=4040;
var itemsProcessed = 0;
var total =0;
var queryData;
//const COLLECTION = 'holyrood16';
const COLLECTION = 'euref';


//Create a db object. We will using this object to work on the DB.
var httpUrlForTransaction = 'http://' + host + ':' + port + '/db/data/transaction/commit';

var ids="";
var i =0;
var idx =0;
var tot=0;
var queries=[];
var currentTweet =-1;
var tags=[];
var retweets=[];
startstream();

function startstream(){
  console.log("starting Mongo Stream");
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

var findTweetsStream = function(db, callback,res) {
  var cursor =db.collection(COLLECTION).find();
  //var cursor =db.collection(COLLECTION).find();
  // var html = '<h2> Results '+queryData.search+' </h2>';
  var counter=0;

  cursor.on('data',
    function(tweet) {
     //if(idx> 60711){
        t = createTweet(tweet);
        storeTweet(t);
        console.log("storing: "+idx++);
     // }
      //console.log("processing: "+idx++);
    }
  );

  cursor.once('end', function() {
    db.close();
    console.log("running queries: ");
    runQueries();
  });
}


function createTweet(tweet){

    var tweet =
    {
        tweetID: tweet.id_str,
        text: tweet.text,
        userName: tweet.user.name,
        date: tweet.created_at
    }
    if(tweet.retweeted_status == null){
        tweet.tweettype = "tweet";
    }
    else{
        tweet.retweetID = tweet.retweeted_status.id_str;
        tweet.tweettype = "retweet";
    }
    var tags = findHashtags(tweet.text);
    if(tags.length>0){
        tweet.tags =tags;
    }
    var mentions = findMentions(tweet.text);
    if(mentions.length>0){
        tweet.mentions =mentions;
    }
    findEU(tweet);
    return tweet;
}

function findEU(tweet){
  tweet.bremain = 0;
  tweet.brexit = 0;
  if(tweet.text.indexOf('bremain')>0 )){
    tweet.bremain = 1;
  }
  if(tweet.text.indexOf('brexit')>0 )){
    tweet.brexit = 1;
  }

}

function findHashtags(searchText) {
    var regexp = /(\s|^)\#\w\w+\b/gm
    result = searchText.match(regexp);
    if (result) {
        result = result.map(function(s){ return s.trim();});
        //console.log(result);
        return result;
    } else {
        return false;
    }
}

function findMentions(searchText) {
    var regexp = /(\s|^)\@\w\w+\b/gm
    result = searchText.match(regexp);
    if (result) {
        result = result.map(function(s){ return s.trim();});
        //console.log(result);
        return result;
    } else {
        return false;
    }
}
// Compact arrays with null entries; delete keys from objects with null value
function removeNulls(obj){
    var isArray = obj instanceof Array;
    for (var k in obj){
        if (obj[k]==null) isArray ? obj.splice(k,1) : delete obj[k];
        else if (typeof obj[k]=="object") removeNulls(obj[k]);
    }
}

function removeSpecials(str) {
    var lower = str.toLowerCase();
    var upper = str.toUpperCase();

    var res = "";
    for(var i=0; i<lower.length; ++i) {
        if(lower[i] != upper[i] || lower[i].trim() === '')
            res += str[i];
    }
    return res;
}

//fires the cypher query.
function runCypherQuery(query, params, callback) {

    setTimeout(function() {
        request.post({
                uri: httpUrlForTransaction,
                json: {statements: [{statement: query, parameters: params}]}
            },
            function (err, res, body) {
                callback(err, body);
            })
    },10);
}

function runCypherQueryMatch(query, callback) {

        request.post({
                uri: httpUrlForTransaction,
                json: {statements: [{statement: query}]}
            },
            function (err, res, body) {
                callback(err, body);
            })


}

function storeTweet(t) {
    var tweetText = "";

    tweetText += 'MERGE (tweet:Tweet {id:"' + t.tweetID + '"})';
    tweetText += '\n SET tweet.text = "' + removeSpecials(t.text) + '"';
    tweetText += ', tweet.created_at = "' + t.date + '"';

    if (t.tweettype == "retweet") {
        tweetText += ', tweet.type = "ReTweet"';
        tweetText += ', tweet.retweet_id = "' + t.retweetID + '"';
    }
    else {
        tweetText += ', tweet.type = "Tweet"';
    }

    tweetText += '\n MERGE (user:User {screen_name:"' + t.userName + '"})';
    tweetText += '\n MERGE (user)-[:POSTS]->(tweet)';

    if (t.tweettype == "retweet") {
        t.matched = "true";
        tweetText += '\n WITH tweet MATCH (retweeted:Tweet {id:"' + t.retweetID + '"})';
        tweetText += '\n CREATE(tweet)-[:ReTweeted]->(retweeted)';
    }
    if(t.location){
        tweetText += '\n MERGE (place:Place {placename:"' + t.location + '"})';
        tweetText += '\n MERGE (tweet)-[:PostedFrom]->(place)';
    }
    if (t.tags) {
        for(var i=0;i< t.tags.length;i++ ){
		//if(t.tags[i].toString()!='scotdebates'||
		  // t.tags[i].toString()!='leadersdebate'||
		   //t.tags[i].toString()!='holyrood16'||
		   //t.tags[i].toString()!='holyrood2016'||
		   //t.tags[i].toString()!='sp16'||
		   //t.tags[i].toString()!='scotland16'){
            		tweetText += '\n MERGE (tag' + (i) + ':Hashtag {name:LOWER("' + t.tags[i].toString() + '")})';
            		tweetText += '\n MERGE (tag' + (i) + ')-[:TAGS]->(tweet)';
		//}
        }
    }
    if (t.mentions) {
        for(var i=0;i< t.mentions.length;i++ ){
          tweetText += '\n WITH tweet MATCH (user:User {id:"' + t.mentions[i] + '"})';
          tweetText += '\n CREATE(tweet)-[:Mentions]->(user)';
        }
    }
    //if (t.urls) {
      //  for(var i=0;i< t.tags.length;i++ ){
        //    tweetText += '\n MERGE (url' + (i) + ':Hashtag {name:LOWER("' + t.tags[i].toString() + '")})';
          //  tweetText += '\n MERGE (url' + (i) + ')-[:Links]->(tweet)';
        //}
    //}



    queries.push(tweetText);

}



function runQueries(){

    runCypher(0);
}

function runCypher(i){
    console.log('Storing ' + i);
    runCypherQueryMatch(
        queries[i], function (err, resp) {
            if (err) {
                console.log(err);
            } else {
                if(i>queries.length){
                    return;
                }
                else{
                    i++;
                    runCypher(i);
                }
            }
        }
    );
}
