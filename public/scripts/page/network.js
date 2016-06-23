

    //TAGcount = number of times a tag is mentioned
    //MATCH (h:Hashtag)-[r]->(n:Tweet)
    //WITH  h, count(h) as tagcount
    //WHERE tagcount > 10
    //RETURN h, tagcount
    //ORDER BY tagcount DESC

    //tweetcount = number of hashtags in a tweet
    //MATCH (h:Hashtag)-[r]->(n:Tweet)
    //WITH  n, count(n) as tweetcount
    //RETURN n, tweetcount
    //ORDER BY tweetcount DESC

    var nodeSelect =false;
    var mouseDown = 0;
    document.body.onmousedown = function() {
        ++mouseDown;
    }
    document.body.onmouseup = function() {
        --mouseDown;
    }

    // setup svg div
    var svg = d3.select("#graph").append("svg")
            .attr("width", "100%").attr("height", "100%")
            .call(d3.behavior.zoom().on("zoom", d3zoom))
            .append("g");
    //$(function(){
    var width = $("#graph").width(), height = $("#graph").height();

    console.log(width +":"+height);
    // force layout setup

    var nodes = [
      { x:   width/3, y: height/2 },
      { x: 2*width/3, y: height/2 }
  ];
  var links = [
  { source: 0, target: 1 }
];

    var force = d3.layout.force()
      .size([width, height])
      .nodes(nodes)
      .links(links);

  force.linkDistance(width/2);

   var link = svg.selectAll('.link')
        .data(links)
        .enter().append('line')
        .attr('class', 'link');

    // Now it's the nodes turn. Each node is drawn as a circle.

    var node = svg.selectAll('.node')
        .data(nodes)
        .enter().append('circle')
        .attr('class', 'node');


        force.on('end', function() {

            node.attr('r', width/25)
                .attr('cx', function(d) { return d.x; })
                .attr('cy', function(d) { return d.y; });


            link.attr('x1', function(d) { return d.source.x; })
                .attr('y1', function(d) { return d.source.y; })
                .attr('x2', function(d) { return d.target.x; })
                .attr('y2', function(d) { return d.target.y; });

        });

        force.start();

        socket.on('node', function(data) {
          console.log(data);

        });




    //});