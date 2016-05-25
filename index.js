var Leaf = require('./src/leaf');
var d3 = require('d3');
var xmldom = require('xmldom');
var jsdom = require("jsdom");
var fs = require('fs');
var document = jsdom.jsdom()


//Lets require/import the HTTP module
var http = require('http');

//Lets define a port we want to listen to
const PORT=8080;

//We need a function which handles requests and send response
function handleRequest(request, response){
  var height = 1500;
  var width = 1500;

  var svg = d3.select(document.body).append("svg")
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr("width", width)
      .attr("height", height)

  var l = Leaf(200, 250, false, new Date().getTime());
  var g = svg.append('g')
    .attr('transform', 'translate(50, 50)')
  g.append('path')
    .attr('d', l.pointspath)
    .style('fill', 'none')
    .style('stroke', 'pink')

  g.append('path')
    .attr('d', l.svgpath)
    .style('fill', 'rgba(80, 200, 80, 0.8)')
    .style('stroke', 'black')

    fs.writeFile('leaf.svg', svg.node().outerHTML);
  response.writeHead(200, {'Content-Type':"image/svg+xml"});
  response.end(svg.node().outerHTML);
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});
