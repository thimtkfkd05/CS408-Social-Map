
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
  , mongodb = require('mongodb');

var app = express();
var port = process.env.PORT || 3000;
var database;

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
app.get('/auth/google_login', routes.google_login);
app.get('/auth/google_access', routes.google_access);
app.get('/')


function connectDB(){
  var databaseUrl = 'mongodb://joindb:ZMbhVsBfyOmsuOePTJfCOddJmJsV0XWR1imvBOGQvMaJMKUlHSYyL70L6ehWcvVTuKLQmZ7KYLiOp5E5cdlpmg==@joindb.documents.azure.com:10250/mean?ssl=true&sslverifycertificate=false'
    var MongoClient = mongodb.MongoClient;

  MongoClient.connect(databaseUrl, function (err, db) {
    if(err) throw err;
    console.log('connection successful');
    database = db;
  });
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
  connectDB()
});
