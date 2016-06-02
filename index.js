var d3 = require('d3');
global.d3 = d3;
require('d3-grid');
var xmldom = require('xmldom');
var jsdom = require("jsdom");
var fs = require('fs');
var document = jsdom.jsdom()
var child_proc = require('child_process');

var DuoLeaf = require('./src/leaf_better');
var UniLeaf = require('./src/leaf');

var http = require('http');
const PORT=8080;

function handleRequest(request, response){
  var width = 1440;
  var height = 2560;

  var svg = d3.select(document.body).append("svg")
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr("width", width)
      .attr("height", height);

  var line = d3.svg.line();

  var grid = d3.layout.grid()
    .bands()
    .size([width, height])
    .padding([0.0, 0.1]);


  var ls = Array.apply(null, Array(1024)).map((d) => {
    return {};
  });


  var r = svg.append('rect')
    .attr('height', height)
    .attr('width', width)
    .style('fill', '#B1E9E8')

  var g = svg.append('g')
    .attr('transform', 'translate(0, 0)')

  var leaves = g.selectAll('g.leaf')
      .data(grid(ls));

  var leafEnter = leaves.enter()
    .append('g')
    .attr('class', 'leaf')
    .attr('transform', (d) => {
      return `translate(${[d.x, d.y]})rotate(${Math.random() * 360})`;
    })
    .each((d) => {
      const duo = (Math.random() > 0.5)
      const Leaf = (duo) ? UniLeaf : DuoLeaf;
      d.l = Leaf(grid.nodeSize()[0], grid.nodeSize()[1],
                 true, 160, new Date().getTime() + Math.random());
    })

  leafEnter.append('path')
  .attr('d', (d) => {
    return (line(d.l.side_l) + 'Z');
  } )
  .style('fill', (d) => d.l.color)
  .style('fill-opacity', 0.8)
  //'rgba(80, 200, 80, 0.8)')
  .style('stroke', (d) => d.l.color)

  leafEnter.append('path')
  .attr('d', (d) => {
    return (line(d.l.side_r) + 'Z');
  } )
  .style('fill', (d) => d.l.color)
  .style('stroke', (d) => d.l.color )
  .style('fill-opacity', 0.8)

  fs.writeFile('leaf.svg', svg.node().outerHTML);
  var a = require('url').parse(request.url)
  if (a.pathname === '/png') {
    var convert = child_proc.spawn("convert", ["svg:", "png:-"])

    convert.stdout.on('data', function (data) {
      response.write(data);
    });
    convert.on('exit', function(code) {
      response.end();
    });

    convert.stdin.write(svg.node().outerHTML);
    convert.stdin.end();
    return;
  }

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
