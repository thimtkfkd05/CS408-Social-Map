var google = require('googleapis');
// for DEBUG
var server_url = 'http://localhost:3000/';

exports.index = function(req, res){
  //res.render('index', { title: 'Express' });
  res.redirect('/events');
};

exports.calendar = function(req, res){
    res.render('calendar.html');
};

exports.events = function(req, res){
    res.render('recommendation.html');
};

exports.calendardata = function(req, res){
    res.render('calendardata.html');
};

exports.google_user = function(req, res) {
    var db_user = req.app.get('db').collection('Users');
    var user_info = req.body;   
    db_user.findOne({
        id: user_info.id,
    }, function(find_err, result) {
        if (!result) {
            db_user.insertOne(user_info, function(insert_err, signup_ok) {
                if (!insert_err && signup_ok) {
                    console.log('signup new user');
                    res.json(true);
                } else {
                    console.log(insert_err);
                    res.json(false);
                }
            });
        } else if (!find_err) {
            db_user.update({
                id: user_info.id
            }, {
                $set: {
                    id_token: user_info.id_token,
                    access_token: user_info.access_token
                }
            }, function(update_err, update_ok) {
                if (update_err) {
                    console.log(update_err);
                    res.json(false);
                } else {
                    console.log('already user, signin');
                    res.json(true);
                }
            });
        } else {
            console.log(find_err);
            res.json(false);
        }
    });
};

exports.event_get = function(req, res) {
    var db_event = req.app.get('db').collection('Heroes');

    db_event.find({
        user_id: req.query.user_id
    }).toArray(function(err, results) {
        if (err) {
            res.json(false);
        } else {
            res.json(results);
        }
    });
};

exports.event_save = function(req, res) {
    var db_event = req.app.get('db').collection('Heroes');

    if (req.body.id) {
        var event_data = req.body;
        db_event.findOne({
            id: event_data.id
        }, function(find_err, find_result) {
            if (find_result) {
                db_event.update({
                    id: event_data.id
                }, {
                    $set: {
                        title: event_data.title,
                        start: event_data.start,
                        end: event_data.end,
                        Allday: event_data.Allday,
                        description: event_data.description,
                        place: event_data.place
                    }
                }, function(update_err, result) {
                    res.json({
                        err: update_err,
                        result: result
                    });
                });
            } else if (!find_err) {
                db_event.insertOne(event_data, function (err, result) {
                    res.json({
                        err: err,
                        result: result
                    });
                });
            } else {
                res.json({
                    err: find_err,
                    result: null
                });
            }
        });
    } else if (req.body.events && req.body.events.length) {
        var events = req.body.events;
        db_event.insertMany(events, function(err, result) {
            res.json({
                err: err,
                result: result
            });
        });
    }
};

exports.remove_event = function(req, res) {
    var db_event = req.app.get('db').collection('Heroes');
    db_event.remove(req.body, function(err, result) {
        if (err) console.log(err);
        res.json(err);
    });
};

exports.one_event = function(req, res) {
    var db_event = req.app.get('db').collection('Heroes');
    db_event.findOne({
        id: req.params.id
    },function(err,result) {
        console.log(result, req.query.id);
        if (!err) {
            res.render('calendardata.html', {
                title: result.title || '',
                start: result.start || '',
                end: result.end || '',
                Allday: result.Allday || false,
                place: result.place || {lat: null, lng: null},
                description: result.description || '',
                open: result.open || false,
            });
        }
        else {
            console.log("error in one_get function: ", err);
        }
    });
};
