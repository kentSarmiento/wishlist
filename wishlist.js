const PORT_NUM = 8080;

var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var readline = require('readline');
var eventemitter = require('events').EventEmitter;

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
      break;
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
  var body = '';
  var authenticate = new eventemitter(); // For authentication process

  req.on('data', function (chunk) {
    body += chunk.toString();
  });
  req.on('end', function () {
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    var dec = querystring.parse(body);
    check_user(dec, authenticate);
  });

  authenticate.on('auth', function () {
    res.write('<html><body>You are authorized!</body></html>');
    res.end();
  });
  authenticate.on('unauth', function () {
    res.write('<html><body>You are not authorized!</body></html>');
    res.end();
  });
}

function check_user(dec, authenticate) {
  var ret = false;

  /* Check if user is authorized */
  var rl = readline.createInterface({input: fs.createReadStream('passwd')});
  rl.on('line', function (line) {
    line = querystring.parse(line);
    if (dec.name == line.name && dec.password == line.password) {
      ret = true;
    }
  });

  rl.on('close', function () {
    if (ret == true) {
      authenticate.emit('auth');
    }
    else {
      authenticate.emit('unauth');
    }
  });
}

function make_wish(dec) {
  /* Write file for wish */
}

function display_list(res) {

}

server.listen(PORT_NUM, listening);
server.on('request', request_handler);
