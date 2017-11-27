
/**
 * Module dependencies.
 */

var express = require('express')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override')
  , logger = require('morgan')
  , errorHandler = require('errorhandler')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , mongodb = require('mongodb')
  , https = require('https');

var app = express();
var port = process.env.PORT || 3000;

app.set('port', port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

app.use(errorHandler());

app.get('/', routes.index);
app.get('/calendar', routes.calendar);
app.get('/events', routes.events);
app.get('/calendardata', routes.calendardata);
app.get('/event_get', routes.event_get);
app.post('/auth/google_user', routes.google_user);
app.post('/event_save', routes.event_save);
app.get('/one_get', routes.one_get);
app.get('/one_event/:id', routes.one_event);
app.get('/https_get', function(req, res) {
    var _result;
    var option = req.query.option ? req.query.option.split(',') : [];
    delete req.query.option;

    req.query.path = new Buffer(req.query.path, 'base64').toString('ascii');
    var request = https.request(req.query, function(result) {
        result.on('data', function(data) {
            _result += data.toString();
        });
        result.on('end', function() {
            _result = _result ? JSON.parse(_result.replace(/undefined/g, '')) : null;
            if (_result) {
                option && option.map(function(val) {
                    _result = _result[val] || _result;
                });
            }
            return res.json(_result || {});
        });
    });
    request.on('error', function(e) {
        console.log('Google API Error: ', e.message);
    });
    request.end();
});

function connectDB(){
  var databaseUrl = 'mongodb://joindb:ZMbhVsBfyOmsuOePTJfCOddJmJsV0XWR1imvBOGQvMaJMKUlHSYyL70L6ehWcvVTuKLQmZ7KYLiOp5E5cdlpmg==@joindb.documents.azure.com:10255/?ssl=true'
    var MongoClient = mongodb.MongoClient;

  MongoClient.connect(databaseUrl, function (err, db) {
    if(err) throw err;
    console.log('connection successful');
    app.set('db', db);
  });
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
  connectDB()
});
