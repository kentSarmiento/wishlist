const PORT_NUM = 8080;

var http = require('http');
var fs = require('fs');

var server = http.createServer();

function listening() {
  console.log('Listening for requests on port ' + PORT_NUM);
}

function request_handler(req, res) {
  switch(req.url) {
    case '/':
      console.log('Providing form');
      display_form(res);
      break;
    case '/upload':
      console.log('Processing form');
      upload_form(req, res);
    case '/view':
      console.log('Providing list');
      display_list(res);
      break;
  }
}

function display_form(res) {
  fs.readFile('form.html', function (err, data) {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': data.length
    });
    res.write(data);
    res.end();
  });
}

function upload_form(req, res) {

}

function display_list(res) {

}

server.listen(PORT_NUM, listening);
server.on('request', request_handler);
