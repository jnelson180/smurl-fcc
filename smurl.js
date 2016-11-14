var express = require('express');
var app = express();
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
// default port is 28017

app.get('/', function(req, res) {
	console.log("Visitor to home page.");
  res.end("Welcome to the home page! \n\nTo use the shortener, go to '(base URL)/yourfullURLhere'");
});

app.get('/*', function(req, res) {
  console.log("Request to shorten '" + req.url.substr(1) + "'");
  res.end();
});

// FOR LOCAL TESTING

app.listen("8080", function () {
  console.log('URL Shortener Microservice listening on port 8080');
});


// FOR HEROKU PROD  
/*
app.listen(process.env.PORT, function () {
  console.log('URL Shortener Microservice listening on port ' + process.env.PORT);
});
*/



