module.exports = function(io) {

  /* GET home page. */
  router.get('/', function(req, res, next) {
    pagetype = "network";
    res.render('network', { title: 'Holyrood16 Tweets' });
  });



var cypher = require('cypher-stream')('http://localhost:7474');

cypher('MATCH (h:Hashtag)-[r]->(n:Tweet)')
  .on('node', function (result){
    io.emit('node' result);
  })
  .on('end', function() {
    //io.emit('node-done',{};
    console.log('all done');
  })
;

};
