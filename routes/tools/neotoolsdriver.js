/**
 * Created by John on 26/06/2015.
 */
//Lets require/import the HTTP module


//We need a function which handles requests and send response
function queryNeo(querytext,io,driver){
  //console.log("dealing with "+querytext);
  var session = driver.session();
  session
    .run(querytext)
    .catch( function(err) {
      console.log(err);
      //if there is an errror print it
      io.emit('neodata',{'error':err});
      session.close();
    })
    .then(function(resp)
    {
      doemit(resp);
      session.close();
    })
}

function doEmit(){
  if(!resp.records || !resp.records[0]){
    console.log("neo tools responce problem...no tweet");
  }
  else {
    var nodes=[], links=[];
    //console.log(resp);
    resp.records[0].data.forEach(function (row) {
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

function idIndex(a,id) {
    for (var i=0;i<a.length;i++) {
        if (a[i].id == id) return i;}
    return null;
}


//Let’s define a function which fires the cypher query.
function runCypherQuery(query, callback) {
    //console.log("Query Posted!  : " +query);
    request.post({
            uri: httpUrlForTransaction,
            json: {statements: [{statement: query, resultDataContents :["graph"]}]}
        },
        function (err, res, body) {
            callback(err, body);
        })
}

module.exports = {
  emitNeoTweet : function (io,driver) {

    queryNeo("MATCH path = (h:Hashtag)-->(n:Tweet)<--(h2:Hashtag) RETURN path ORDER BY n.stored_at DESC LIMIT 1",io, driver);
  }
};
