
/**
 * Module dependencies.
 */

var express = require('express')
  , session = require('express-session')
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

var auth_google_id = function(req, res, next) {
    req.session.user_id = req.body.id;
    next();
};
var clear_google_id = function(req, res, next) {
    req.session.destroy(function(err) {
        next();
    });
};

var check = function(req, res, next) {
    if (!req.session.user_id) {
        res.redirect('/calendar');//'/login');
    } else {
        next();
    }
};

app.set('port', port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(session({
    secret: 'tkdghqkqh',
    resave: false,
    saveUninitialized: true
}));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

app.use(errorHandler());

app.get('/', check, routes.index);
app.get('/calendar', routes.calendar);
app.get('/events', check, routes.events);
app.get('/event/new', check, routes.event_new);
app.get('/event_get', check, routes.event_get);
app.post('/auth/google_user', auth_google_id, routes.google_user);
app.post('/auth/google_user/logout', check, clear_google_id, function(req, res) {
    res.json(null);
});
app.post('/event_save', check, routes.event_save);
app.post('/event_remove', check, routes.event_remove);
app.get('/event/edit/:id', check, routes.event_edit);
app.get('/get_open_event', check, routes.get_open_event);
app.get('/https_get', check, function(req, res) {
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

var script_for_add_open_fb_event = function(db) {
    var open_events = require('./open_event3.json');
    console.log(typeof open_events, open_events.length);
    var async = require('async');
    async.mapLimit(open_events, 10, function(item, next) {
        item.Allday = false;
        item.open = true;
        item.start = new Date(item.start_time).toISOString();
        item.end = new Date(item.end_time).toISOString();
        item.title = item.name;
        if (new Date(item.end_time).getTime() - new Date(item.start_time).getTime() > 3600 * 24) {
            item.open_day = new Date(new Date(new Date(item.start_time).setHours(0)).setMinutes(0)).toISOString();
            item.close_day = new Date(new Date(new Date(item.end_time).setHours(0)).setMinutes(0)).toISOString();
        }
        delete item.name;
        delete item.start_time;
        delete item.end_time;
        delete item.event_times;

        if (item.place) {
            if (!item.place.location) {
                var req_option = {
                    host: 'maps.googleapis.com',
                    path: '/maps/api/place/textsearch/json?query=' + encodeURIComponent(item.place.name) + '&key=AIzaSyBVhAysUuLePfYO9EKf-de-XBfzU2Vg1fk',
                    method: 'GET'
                };
                var _result;
                var option = ['results','0','geometry','location'];

                var request = https.request(req_option, function(result) {
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
                        console.log(_result);
                        item.place = _result && typeof(_result) === 'object' && _result.lat ? _result : {lat: null, lng: null};
                        console.log(item.place, _result);
                        next(null, item);
                    });
                });
                request.on('error', function(e) {
                    console.log('Google API Error: ', e.message, item.place, req_option.host + req_option.path);
                    next(item.place, item);
                });
                request.end();
            } else {
                item.place = {lat: item.place.location.latitude, lng: item.place.location.longitude};
                next(null, item);
            }
        } else {
            item.place = {lat: null, lng: null};
            next(null, item);
        }
    }, function(async_err, results) {
        if (!async_err) {
            db.collection('Heroes').insertMany(results, function(_err) {
                console.log("Insert Complete! ", _err);
            });
        } else {
            console.log("Async err: ", async_err);
        }
    });
};


var script_for_add_open_event = function(db) {
    db.collection('Heroes').remove({
        open: true
    }, function(remove_err) {
        var open_events = require('./open_event.json');
        console.log(typeof open_events, open_events.length);
        var async = require('async');
        async.mapLimit(open_events, 10, function(item, next) {
            item.Allday = !!item.Allday;
            item.open = true;
            item.description = item.description.replace(/\<br\>/g, '\n');
            item.start = new Date(item.open_day + (item.start ? ' ' + item.start : '')).toISOString();
            item.end = new Date(item.close_day + (item.end ? ' ' + item.end : '')).toISOString();
            if (item.place) {
                var req_option = {
                    host: 'maps.googleapis.com',
                    path: '/maps/api/place/textsearch/json?query=' + encodeURIComponent(item.place) + '&key=AIzaSyBVhAysUuLePfYO9EKf-de-XBfzU2Vg1fk',
                    method: 'GET'
                };
                var _result;
                var option = ['results','0','geometry','location'];

                var request = https.request(req_option, function(result) {
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
                        console.log(_result);
                        item.place = _result && typeof(_result) === 'object' && _result.lat ? _result : {lat: null, lng: null};
                        console.log(item.place, _result);
                        next(null, item);
                    });
                });
                request.on('error', function(e) {
                    console.log('Google API Error: ', e.message, item.place, req_option.host + req_option.path);
                    next(item.place, item);
                });
                request.end();
            } else {
                next(null, item);
            }
        }, function(async_err, results) {
            if (!async_err) {
                db.collection('Heroes').insertMany(results, function(_err) {
                    console.log("Insert Complete! ", _err);
                });
            } else {
                console.log("Async err: ", async_err);
            }
        });
    });
};
