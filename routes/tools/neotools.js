/**
 * Created by John on 26/06/2015.
 */
//Lets require/import the HTTP module
var http = require('http');
var request = require("request");
var url = require('url') ;

//var host = 'localhost',
  //  port = 7474;

//Create a db object. We will using this object to work on the DB.
//var httpUrlForTransaction = 'http://' + host + ':' + port + '/db/data/transaction/commit';
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4j:neo4j@localhost:5050');


//We need a function which handles requests and send response
function queryNeo(querytext,io){
  //console.log("dealing with "+querytext);
      runCypherQuery(
        querytext, function (err, resp) {
            if (err) {
                console.log(err);

            } else {
              if(!resp.results || !resp.results[0]){
                //console.log("neo tools responce problem...no tweet");
              }
              else {
                var nodes=[], links=[];
                //console.log(resp);
                resp.results[0].data.forEach(function (row) {
                    row.graph.nodes.forEach(function (n) {

                        if (idIndex(nodes,n.id) == null) {

                                //console.log(n);
                                if (n.labels[0] == "Tweet" ) {
                                  if(n.properties.type == "Tweet") {
                                      nodes.push({
                                          id: n.id,
                                          title: n.properties.created_at,
                                          label: n.properties.type,
                                          created: n.properties.created_at,
                                          eu: n.properties.eu,
                                          distance: 1
                                      });
                                  }
                                  else{
                                      nodes.push({
                                          id: n.id,
                                          title: n.properties.created_at,
                                          label: n.properties.type,
                                          created: n.properties.created_at,
                                          eu: n.properties.eu,
                                          distance: 1.5
                                      });
                                  }


                                }
                                else if(n.labels[0] == "User"){
                                    nodes.push({id: n.id, title: n.properties.screen_name, label: n.labels[0], distance: 1});
                                }
                                else if(n.labels[0] == "Hashtag"){
                                    nodes.push({id: n.id, title: n.properties.name, label: n.labels[0], created: n.properties.created_at, distance: 2});
                                }
                                else {
                                    nodes.push({id: n.id, label: n.labels[0], distance: 1});
                                }

                        }
                    });

                    links = links.concat( row.graph.relationships.map(function(r) {
                       // console.log(idIndex(nodes,r.startNode)+":"+idIndex(nodes,r.endNode)+":"+ r.type);

                        return {source:idIndex(nodes,r.startNode), start:idIndex(nodes,r.startNode),target:idIndex(nodes,r.endNode),end:idIndex(nodes,r.endNode),type:r.type};
                    }));
                });
                var viz = {nodes:nodes, links:links};
                io.emit('neodata',viz);
            }
          }
        }
    );

}

function idIndex(a,id) {
    for (var i=0;i<a.length;i++) {
        if (a[i].id == id) return i;}
    return null;
}


//Let’s define a function which fires the cypher query.
//function runCypherQuery(query, callback) {
    //console.log("Query Posted!  : " +query);
//    request.post({
//            uri: httpUrlForTransaction,
//            json: {statements: [{statement: query, resultDataContents :["graph"]}]}
//        },
//        function (err, body) {
//            callback(err, body);
//            //res.emit('end');
//        })
//}



function runCypherQuery(query, callback) {
  db.http({
    method: 'POST',
    path: '/db/data/transaction/commit',
    json: {statements: [{statement: query, resultDataContents :["graph"]}]}
  }, function (err,body) {
             callback(err, body);
              //res.emit('end');
          });
}

module.exports = {
  emitNeoTweet : function (io) {
    queryNeo("MATCH (n:Tweet) WITH n ORDER BY n.stored_at DESC LIMIT 1 MATCH n-[r]-(p) RETURN n,r,p",io);
  }
};
