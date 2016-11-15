var express = require('express');
var app = express();
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
// var assert = require('assert');
var dbUrl = 'mongodb://localhost:27017/smurl';

// connect to MongoDB
MongoClient.connect(dbUrl, function(err, db) {
    // assert.equal(null, err);
    console.log("Connected successfully to server");

    // Print 'documents' db to console
    function showDB() {
        var collection = db.collection('documents');
        collection.find({}).toArray(function(err, docs) {
            if (err) throw err;
            console.log(docs);
        });
    }
    showDB();

    // Show home page
    app.get('/', function(req, res) {
        console.log("Visitor to home page.");
        res.end("Welcome to the home page! \n\nTo use the shortener, go to '(base URL)/yourfullURLhere'");
    });

    // Send req through URL parser
    app.get('/*', function(req, res) {
        var reqUrl = req.url.substr(1);
        console.log('reqUrl is ' + reqUrl * 1);
        var collection = db.collection('documents');

        // if URL is a number, check against short_urls
        if (reqUrl * 1 > 0) {
            collection.find({
                short_url: "http://localhost:8080/" + reqUrl
            }).toArray(function(err, docs) {
                if (err) {
                    console.log("Err");
                    res.send("Invalid URL");
                    throw err;
                    return;
                }

                // if short_url exists, redirect user
                if (docs[docs.length - 1] != undefined) {
                    console.log("Found a record for " + reqUrl + ", redirecting to " + docs[docs.length - 1].original_url + ".");
                    console.log(docs[docs.length - 1]);
                    res.redirect(redir(docs[docs.length - 1].original_url));
                    res.end();
                }

                // otherwise output "Invalid URL" to page
                else if (docs[docs.length - 1] == undefined) {
                    console.log("Err");
                    res.send("Invalid URL");
                }
            });
        }
        // if URL is not a number, proceed to search db or shorten
        else {
            // search db for original_url, return record if found
            collection.find({
                original_url: reqUrl
            }).toArray(function(err, docs) {
                if (err) throw err;
                if (docs[docs.length - 1] != undefined) {
                    console.log("Found a record for requested URL.");
                    res.send(JSON.stringify({
                        original_url: docs[docs.length - 1].original_url,
                        short_url: docs[docs.length - 1].short_url
                    }));
                }
                // otherwise shorten req URL
                else {
                    console.log("Request to shorten '" + reqUrl + "'");
                    collection.insert([{
                        original_url: reqUrl,
                        short_url: getShortUrl()
                    }], function(err, result) {
                        console.log(result.ops[0].original_url);
                        res.send(JSON.stringify({
                            original_url: result.ops[0].original_url,
                            short_url: result.ops[0].short_url
                        }));
                    });
                }
            });
        }

    });
});


// generate short URL token
function getShortUrl() {
    var token = String(Date.now()).slice(-4) + (Math.floor(Math.random() * 999) + 1);
    var smurl = "http://localhost:8080/" + token;
    console.log(smurl);
    return smurl;
}

// prepend http to URL if a prefix does not exist
function redir(url) {
    tempurl = url.toLowerCase();
    var pre1 = "http://";
    var pre2 = "https://";
    var pre3 = "file:///";
    var pre4 = "localhost:";

    if (tempurl.indexOf(pre1) == 0) {
        return url;
    } else if (tempurl.indexOf(pre2) == 0) {
        return url;
    } else if (tempurl.indexOf(pre3) == 0) {
        return url;
    } else if (tempurl.indexOf(pre4) == 0) {
        return url;
    } else {
        url = "http://" + url;
        console.log("redir to " + url);
        return url;
    }
}

// FOR LOCAL TESTING

app.listen("8080", function() {
    console.log('URL Shortener Microservice listening on port 8080');
});


// FOR HEROKU PROD  
/*
app.listen(process.env.PORT, function () {
  console.log('URL Shortener Microservice listening on port ' + process.env.PORT);
});
*/