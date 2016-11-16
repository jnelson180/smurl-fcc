var express = require('express');
var app = express();
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var dbUrl = process.env.MONGOLAB_URI;
var port = process.env.PORT || 8080;

app.set('view engine', 'ejs');

// make express look in public dir for assets (css/js/img/etc)
app.use(express.static(__dirname + '/public'))

// connect to MongoDB
MongoClient.connect(dbUrl, function(err, db) {
    if (err) throw err;
    console.log("Connected successfully to server");

    // Show home page
    app.get('/', function(req, res) {
        console.log("Visitor to home page.");
        res.render('index');
        res.end();
    });

    // Send req through URL parser
    app.get('/*', function(req, res) {
        var reqUrl = req.url.substr(1);
        var collection = db.collection('documents');
        console.log("Incoming request to " + req.url);

        // if URL is a number, check against short_urls
        if (reqUrl * 1 > 0) {
            collection.find({
                short_url: "https://smurl-app.herokuapp.com/" + reqUrl
            }).toArray(function(err, docs) {
                if (err) {
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
                    console.log("Invalid short URL requested.");
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
                    console.log(JSON.stringify({
                        original_url: docs[docs.length - 1].original_url,
                        short_url: docs[docs.length - 1].short_url
                    }));
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
    var smurl = "https://smurl-app.herokuapp.com/" + token;
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

app.listen(port, function() {
    console.log('URL Shortener Microservice listening at https://smurl-app.herokuapp.com');
});