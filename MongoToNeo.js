/**
 * Created by John on 21/07/2015.
 */
//loads in tweets in Marcos format.



var lazy    = require("lazy"),
    fs  = require("fs"),
    request = require("request"),
    prompt = require('prompt'),
    http = require('http').globalAgent.maxSockets = Infinity;
var host = 'localhost',
    port = 7474;

//Create a db object. We will using this object to work on the DB.
var httpUrlForTransaction = 'http://' + host + ':' + port + '/db/data/transaction/commit';

var ids="";
var i =0;
var idx =0;
var tot=0;
var queries=[];
var currentTweet =-1;
var tags[];
var retweets[];


new lazy(fs.createReadStream('./data/mapping_tweets_retweets.txt'))
    .lines
    .forEach(function(line){

        //if(tot>=0 && tot<1000) {
            var t;
            var linestring = line.toString();
            if (linestring.charAt(0) != "\t") {
                currentTweet = -1;
            }
            else {
                linestring = linestring.substring(1);
            }
            t = createTweet(linestring.split("\t"));
            //console.log(t.tags);
            storeTweet(t);
            idx++;

            console.log('Processing ' + tot);
            //console.log(t.tweetID +":"+ t.tweettype+":"+t.retweetID+":"+ t.matched);
        //}
        tot++;
    })
    .on('pipe', function() {
        console.log(queries.length);
        runQueries();
    });


function createTweet(tweetArray){

    var tweet =
    {
        tweetID: tweetArray[0].toString().trim(),
        text: tweetArray[1].toString().trim(),
        polarity: tweetArray[2].toString().trim(),
        polscore: tweetArray[3].toString().trim(),
        mixedValue: tweetArray[4].toString().trim(),
        userName: tweetArray[5].toString().trim(),
        date: tweetArray[6].toString().trim(),
        place: tweetArray[7].toString().trim(),
        location: tweetArray[8].toString().trim()
    }
    if(currentTweet < 0){

        currentTweet = tweetArray[0].toString().trim();
        //tweets[currentTweet] =0;
        tweet.tweettype = "tweet";
    }
    else{
        //tweets[currentTweet]++;
        tweet.retweetID = currentTweet;
        tweet.tweettype = "retweet";
    }
    var tags = findHashtags(tweet.text);
    if(tags.length>0){
        tweet.tags =tags;
    }
    return tweet;
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

//Let’s define a function which fires the cypher query.
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
            tweetText += '\n MERGE (tag' + (i) + ':Hashtag {name:LOWER("' + t.tags[i].toString() + '")})';
            tweetText += '\n MERGE (tag' + (i) + ')-[:TAGS]->(tweet)';
        }
    }



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
