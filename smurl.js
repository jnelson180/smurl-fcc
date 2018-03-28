var express = require('express');
var app = express();
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var dbUrl = process.env.MONGOLAB_URI;
var port = process.env.PORT || 8080;
var validUrl = require('valid-url');
var path = require('path');

/* TO DO -----------------------------------------------------

1. User Story: If I pass an invalid URL that doesn't follow 
the valid http://www.example.com format, the JSON response 
will contain an error instead.

*/

app.set('view engine', 'ejs');

// make express look in public dir for assets (css/js/img/etc)
app.use('/public', express.static(path.join(__dirname, '/public')));

// connect to MongoDB
MongoClient.connect(dbUrl, (err, db) => {
    if (err) {
        throw err;
    }

    // Show home page
    app.get('/', function (req, res) {
        res.render('index');
        res.end();
    });

    // Send req through URL parser
    app.get('/*', function (req, res) {
        var reqUrl = req.url.substr(1);
        var collection = db.collection('documents');

        // if URL is a number, check against short_urls
        if (Number(reqUrl) !== NaN) {
            collection.find({
                short_url: "https://smurl-app.herokuapp.com/" + reqUrl
            }).toArray((err, docs) => {
                if (err) {
                    res.send(JSON.stringify({
                        error: "An internal error has occurred."
                    }));
                    throw err;
                    return;
                }

                // if short_url exists, redirect user
                if (docs[docs.length - 1] !== undefined) {
                    res.redirect(redir(docs[docs.length - 1].original_url));
                    res.end();
                }

                // otherwise output "Invalid URL" to page
                else if (docs[docs.length - 1] === undefined) {
                    res.send(JSON.stringify({
                        error: "This URL is not in the database."
                    }));
                }
            });
        } else {
            // if URL is not a number, proceed to search db or shorten
            // search db for original_url, return record if found
            collection
                .find({
                    original_url: reqUrl
                })
                .toArray((err, docs) => {
                    if (err) {
                        throw err;
                    }

                    if (docs[docs.length - 1] !== undefined) {
                        res.send(JSON.stringify({
                            original_url: docs[docs.length - 1].original_url,
                            short_url: docs[docs.length - 1].short_url
                        }));
                    } else {
                        // otherwise shorten req URL
                        if (isValidUrl(req.url.substr(1))) {
                            collection.insert([{
                                original_url: reqUrl,
                                short_url: getShortUrl()
                            }], (err, result) => {
                                res.send(JSON.stringify({
                                    original_url: result.ops[0].original_url,
                                    short_url: result.ops[0].short_url
                                }));
                            });
                        } else {
                            // invalid url format requested
                            res.send(JSON.stringify({
                                error: "Invalid URL format. Please use format 'http://www.example.com' or 'https://www.example.com'."
                            }));
                        }
                    }
            });
        }
    });
});

// validate URL
function isValidUrl(urlToCheck) {
    if (validUrl.isWebUri(urlToCheck)) {
        return true;
    } else {
        return false;
    }
}

// generate short URL token
function getShortUrl() {
    var token = String(Date.now()).slice(-4) + (Math.floor(Math.random() * 999) + 1);
    var smurl = "https://smurl-app.herokuapp.com/" + token;
    return smurl;
}

// prepend http to URL if a prefix does not exist
function redir(url) {
    tempUrl = url.toLowerCase();
    var pre1 = "http://";
    var pre2 = "https://";
    var pre3 = "file:///";
    var pre4 = "localhost:";

    const prefixes = ["http://", "https://", "file:///", "localhost:"];

    if (prefixes.indexOf(tempUrl) > -1) {
        return url;
    }

    url = "http://" + url;
    return url;
}

app.listen(port, () => {
    console.log(`URL Shortener microservice listening at ${port}`);
});