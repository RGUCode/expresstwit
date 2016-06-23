/**
 * Created by John on 27/05/2016.
 */
//translate tweets to neo4j.

var neo4j = require('neo4j-driver').v1;

var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j"));




var itemsProcessed = 0;
var total =0;
var queryData;
var neotools = require('./neotools');

var ids="";
var i =0;
var idx =0;
var tot=0;
var queries=[];
var currentTweet =-1;
var tags=[];
var retweets=[];
var io = null;

function createTweet(tweet){
try{
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
  catch(e){
    console.log(e);
    return null;
  }
}

function findEU(tweet){
  tweet.bremain = 0;
  tweet.brexit = 0;
  if(tweet.text.indexOf('bremain')>0 ||
  tweet.text.indexOf('yes2eu')>0 ||
  tweet.text.indexOf('yestoeu')>0 ||
  tweet.text.indexOf('betteroffin')>0 ||
  tweet.text.indexOf('votein')>0 ||
  tweet.text.indexOf('ukineu')>0 ||
  tweet.text.indexOf('strongerin')>0 ||
  tweet.text.indexOf('leadnotleave')>0 ||
  tweet.text.indexOf('voteremain')>0)
  {
    tweet.bremain = 1;
  }
  if(tweet.text.indexOf('brexit')>0 ||
  tweet.text.indexOf('no2eu')>0 ||
  tweet.text.indexOf('notoeu')>0 ||
  tweet.text.indexOf('betteroffout')>0 ||
  tweet.text.indexOf('voteout')>0 ||
  tweet.text.indexOf('britainout')>0 ||
  tweet.text.indexOf('voteleave')>0 ||
  tweet.text.indexOf('beleave')>0 ||
  tweet.text.indexOf('leaveeu')>0)
  {
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
  //io.emit('neodata',{'query':'sending query'});
        request.post({
                uri: httpUrlForTransaction,
                json: {statements: [{statement: query}]}
            },
            function (err, res, body) {
              //io.emit('neodata',{'query':'sending query response'});
                callback(err, body);
            })


}

function storeTweet(t) {
  if (t.text){
    var tweetText = "";
    tweetText += 'MERGE (tweet:Tweet {id:"' + t.tweetID + '"})';
    tweetText += '\n SET tweet.text = "' + removeSpecials(t.text) + '"';
    tweetText += ', tweet.created_at = "' + t.date + '"';
    tweetText += ', tweet.stored_at = TIMESTAMP()';

    if (t.tweettype == "retweet") {
        tweetText += ', tweet.type = "ReTweet"';
        tweetText += ', tweet.retweet_id = "' + t.retweetID + '"';
    }
    else {
        tweetText += ', tweet.type = "Tweet"';
    }

    if(t.bremain == 1 && t.brexit == 1){
      tweetText += ', tweet.eu = "both"';
    }
    else if(t.bremain==1){
      tweetText += ', tweet.eu = "bremain"';
    }
    else if(t.brexit==1){
      tweetText += ', tweet.eu = "brexit"';
    }
    else{
      tweetText += ', tweet.eu = "neither"';
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
    //var session = driver.session();
    //session
  //    .run(tweetText)
  //    .catch( function(err) {
  //      console.log(err);
  //      session.close();
        //if there is an errror print it
  //      io.emit('neo',{'error':err});

//})
  //    .then( function()
//      {
  //      session.close();
  //      neotools.emitNeoTweet(io);

    //  })


//     //queries.push(tweetText);
     runCypherQueryMatch(tweetText, function (err, resp) {
       //io.emit('neodata',{'query':'query response'});
       //ru the query against neo4J- Basically add the tweets as a node and associated links
       if (err) {
         console.log(err);
         //if there is an errror print it
         io.emit('neodata',{'error':err});
       }
       else{
         console.log(resp);
         //other wise use io to signal client that an update has just happened.
         //io.emit('neodata',{'test':"ello"});
         //io.emit('neo',{'resp':resp});
         neotools.emitNeoTweet(io);


       }
   });
}

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
//module exports exposes this function to external nodeJS files.
module.exports = {
  processTweet : function (tweet, appio) {
    io = appio;
    var t = createTweet(tweet);
    if(t !=null){
      //io.emit('neodata',{'resp':tweet});
      storeTweet(t);
      //console.log("processing: "+idx);
    }

  }
};
