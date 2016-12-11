const PORT_NUM = 8080;
const DICTIONARY = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
const PASS_LENGTH = 10;
const COMMENT_EXT = '_com.txt';


var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var readline = require('readline');
var eventemitter = require('events').EventEmitter;
var express = require('express');
var path = require('path');

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
    case '/comment':
      console.log('Processing comments');
      send_comment(req, res);
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
  var dec = '';
  var authenticate = new eventemitter();  // For authentication process

  req.on('data', function (chunk) {
    body += chunk.toString();
  });
  req.on('end', function () {
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    dec = querystring.parse(body);
    check_user(dec, authenticate);
  });

  authenticate.on('auth', function (password) {
    if (password == '') {
      res.write('<html><body>You are authorized! Your wish is our command!</body></html>');
    }
    else {
      res.write('<html><body>You are now authorized with ' + password + '!</body></html>');
    }
    make_wish(dec);
    res.end();
  });
  authenticate.on('unauth', function () {
    res.write('<html><body>You are not authorized!</body></html>');
    res.end();
  });
}

function check_user(dec, authenticate) {
  var valid = false;
  var found = false;
  var empty = false;

  if (dec.password == '') {
    empty = true;
  }

  /* Check if user is authorized */
  var rl = readline.createInterface({terminal: false, input: fs.createReadStream('passwd')});
  rl.on('line', function (line) {
    line = querystring.parse(line);
    if (dec.name == line.name && dec.password == line.password) {
      valid = true;
    }
    else if (dec.name == line.name) {
      found = true;
    }
  });

  rl.on('close', function () {
    if (valid == true) {
      authenticate.emit('auth', '');
    }
    else if (found == true) {
      authenticate.emit('unauth');
    }
    else if (empty == true) {
      var password = generate_password();
      var newline = 'name=' + dec.name + '&password=' + password + '\n';
      console.log(newline);
      fs.appendFile('passwd', newline, function (err) {
        if (err) throw err;
      });
      authenticate.emit('auth', password);
    }
    else {
      authenticate.emit('unauth');
    }
  });
}

function generate_password() {
  var password = "";

  for (var count = 0; count < PASS_LENGTH; count++) {
    var index = Math.floor(Math.random() * DICTIONARY.length);
    password += DICTIONARY.charAt(index);
  }

  return password;
}

function make_wish(dec) {
  var filename = dec.name + '.txt';
  var filedata = '';

  /* Write file for wish */
  filedata += 'wish1=' + dec.wish1 + '&';
  filedata += 'wish2=' + dec.wish2 + '&';
  filedata += 'wish3=' + dec.wish3;
  console.log(filedata);

  fs.writeFile(filename, filedata, function (err) {
    if (err) throw err;
  });
}

function display_list(res) {
  var parse_all = new eventemitter(); // For parsing wishes

  parse_files(parse_all);

  parse_all.on('finished', function (list) {
    //res.write('<html><body>' + list + '</body></html>');
    document.content.wishes.wishlist.value = list;
    res.end();
  });
}

function parse_files(parse_all) {
  var list = '';
  var total = 0;        // Total files to parse
  var finished = 0;     // Files already parsed

  /* Read passwd file for list of all codenames */
  var rl = readline.createInterface({input: fs.createReadStream('passwd')});
  rl.on('line', function (line) {
    total += 2; // For both wish and comments
    line = querystring.parse(line);

    var filename = line.name + '.txt';
    var parse_one = new eventemitter(); // For parsing each wish file
    parse_file(filename, parse_one);

    filename = line.name + COMMENT_EXT;
    parse_one = new eventemitter(); // For parsing each comment file
    parse_file(filename, parse_one);

    parse_one.on('wish', function (line2) {
      list += 'codename=' + line.name + ': ';
      list += line2; // New line is disregarded
      list += '<br />';
      console.log(list);
      console.log(finished);
      finished++;

      /* Parsing of all files is finished */
      if (total == finished) {
        parse_all.emit('finished', list);
      }
    });
  });
}

function parse_file(filename, parse_one) {
  fs.readFile(filename, function (err, data) {
    if (err) throw err;
    parse_one.emit('wish', data);
  });
}

function send_comment(req, res) {
  var body = '';
  var dec = '';

  req.on('data', function (chunk) {
    body += chunk.toString();
  });
  req.on('end', function () {
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    dec = querystring.parse(body);
    write_comment(dec);
    res.end();
  }
}

function write_comment(dec) {
  var filename = dec.name + COMMENT_EXT;
  var filedata = '';

  /* Write file for comment */
  filedata += 'comment=' + dec.comment + '&';
  console.log(filedata);

  fs.appendFile(filename, filedata, function (err) {
    if (err) throw err;
  });
}

server.listen(PORT_NUM, listening);
server.on('request', request_handler);
