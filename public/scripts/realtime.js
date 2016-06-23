

  //inelegant if else method to check whether a tweet supports the leave campaign
  //because js complained when I tried making a function with an array of strings
  //probably encoding issues
  //I don't have time for that
  function manualLeaveCheck(tweet){
    if (tweet.toLowerCase().indexOf('no2eu') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('notoeu') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('betteroffout') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('voteout') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('britainout') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('leaveeu') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('voteleave') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('beleave') >= 0){
      return true;
    }
    else{
      return false;
    }
  };

  //another inelegant if else method to check whether a tweet supports the remain campaign
  function manualRemainCheck(tweet){
    if (tweet.toLowerCase().indexOf('bremain') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('yes2eu') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('yestoeu') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('betteroffin') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('votein') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('ukineu') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('strongerin') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('leadnotleave') >= 0){
      return true;
    }
    else if (tweet.toLowerCase().indexOf('voteremain') >= 0){
      return true;
    }
    else{
      return false;
    }

  };

  function tweetSearch(string1, string2){
        if(string1.toLowerCase().indexOf(string2)>=0){
          //console.log(entry);
          return true;
        }
        return false;
  }

  function random(name) {
    var value = 0,
        values = [],
        i = 0,
        last;
        return context.metric(function(start, stop, step, callback) {
      start = +start, stop = +stop;
      if (isNaN(last)) last = start;
      while (last < stop) {
        last += step;
        if(name=="stay"){
          values.push(stayc);
          stayc =0;
        }
        if(name=="leave"){
          values.push(leavec);
          leavec=0;
        }
        if(name=="other"){
          values.push(otherc);
          otherc=0;
        }

      }
      callback(null, values = values.slice((start - stop) / step));
    }, name);
  }
  //label values for each graph
  var stayl=0;
  var leavel=0;
  var otherl=0;

  //setting params for cubism graphs (e.g. time)
  var context = cubism.context()
      .serverDelay(0)
      .clientDelay(0)
      .step(62.5)
      .size(960);

  var stay = random("stay");
  var leave = random("leave");
  var other = random("other");

  //counters for each graph
  var stayc=0;
  var leavec=0;
  var otherc=0;

  var dataeuref = [];

  //REMAIN CUBISM GRAPH ==========================================================
  d3.select("#staygraph").call(function(div)
  {
    div.datum(stay);
    stayc =0;
    div.append("div")
      .attr("class", "horizon")
      .call(context.horizon()
        .height(80)
        .colors(["#9edae5","#62c3d5", "#b4db8d"])
        .title("Remain in EU")
        .extent([0, 10]));
  });
  //LEAVE CUBISM GRAPH ===========================================================
  d3.select("#leavegraph").call(function(div)
  {
    div.datum(leave);
    leavec =0;
    div.append("div")
      .attr("class", "horizon")
      .call(context.horizon()
        .height(80)
        .colors(["#9edae5", "#8ec953","#dbb48d"])
        .title("Leave the EU")
        .extent([0, 10]));
  });
  //DISCUSSION CUBISM GRAPH ======================================================
  d3.select("#othergraph").call(function(div)
  {
    div.datum(other);
    otherc =0;
    div.append("div")
      .attr("class", "horizon")
      .call(context.horizon()
        .height(80)
        .colors(["#9edae5","#c98e53", "#9edae5"])
        .title("Brexit Discussion")
        .extent([0, 10]));
  });
  //SOCKETS ======================================================================

  //create socket
  var socket = io();
  //listen on 'welcome' label
    socket.on('welcome', function(data) {
      var tweet = data.tweet;
      if(tweet==null){
        console.log('No tweet to display!');
      }else{
        addMessage(tweet);
        sortTweet(tweet);
      };
    });
//log errors to console
    socket.on('error', console.error.bind(console));
    socket.on('message', console.log.bind(console));
    socket.on('data', console.log.bind(console));
//function to display tweet on page
    function addMessage(tweet) {
      document.getElementById('tweets').innerHTML =
      "<h3>"+tweet+"</h3>"
    }
//function to add to appropriate counter depending on tweet content (will add to graph)
    function sortTweet(tweet){
      if(manualRemainCheck(tweet)){
        if (manualLeaveCheck(tweet)){
          otherc++;
        }
        else if(tweetSearch(tweet, 'brexit')){
          stayc++;
        }
        else{
          stayc++;
        }
      }
      else if (manualLeaveCheck(tweet)){
        if (manualRemainCheck(tweet)){
          otherc++;
        }
        else if(tweetSearch(tweet, 'brexit')){
          leave++;
        }
        else{
          leavec++;
        }
      }
      else if(tweetSearch(tweet, 'brexit')){
        otherc++;
      }
    }