const PORT_NUM = 8081;

var http = require('http');
var fs = require('fs');
var path = require('path');

var server = http.createServer();

function listening() {
  console.log('File server listening for requests on port ' + PORT_NUM);
}

function request_handler(req, res) {
  var file = '.' + req.url;
  var extension = path.extname(file);
  var type = 'text/html';

  console.log('Handling request for ' + req.url);

  switch (extension) {
    case '.js':
      type = 'text/javascript';
      break;
    case '.css':
      type = 'text/css';
      break;
    case '.json':
      type = 'application/json';
      break;
    case '.png':
      type = 'image/png';
      break;
    case '.jpg':
      type = 'image/jpg';
      break;
    case '.pdf':
      type = 'application/pdf';
      break;
  }

  fs.readFile(file, function(err, data) {
    if (err) {
      res.writeHead(404);
      res.write('File not found');
    }
    else {
      res.writeHead(200, { 'Content-Type': type });
      res.write(data);
    }
    res.end();
  });
}

server.listen(PORT_NUM, listening);
server.on('request', request_handler);
