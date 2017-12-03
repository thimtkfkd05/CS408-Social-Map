var google = require('googleapis');
// for DEBUG
var server_url = 'http://localhost:3000/';
var async = require('async');

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

exports.event_new = function(req, res){
    res.render('calendardata.new.html');
};

exports.login = function(req, res){
    res.render('login.html');
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
        $or: [{
            user_id: req.session.user_id,
            open: false
        }, {
            user_id: req.session.user_id,
            id: new RegExp('_' + req.session.user_id + '$')
        }]
    }).toArray(function(err, results) {
        if (err) {
            res.json(false);
        } else {
            results = results.map(function(item) {
                var start = item.start;
                var end = item.end;
                item.start = new Date(new Date(start).getTime() + 3600*9*1000).toISOString();
                item.end = new Date(new Date(end).getTime() + 3600*9*1000).toISOString();
                return item;
            });
            res.json(results);
        }
    });
};

exports.event_save = function(req, res) {
    var db_event = req.app.get('db').collection('Heroes');
    if (req.body.id) {
        var event_data = req.body;
        event_data.user_id = req.session.user_id;
        db_event.findOne({
            id: event_data.id
        }, function(find_err, find_result) {
            if (find_result) {
                event_data.open = String(event_data.open) == 'true';
                var update_option = {
                    $set: {
                        title: event_data.title,
                        start: event_data.start,
                        end: event_data.end,
                        Allday: String(event_data.Allday) == 'true',
                        description: event_data.description,
                        place: event_data.place,
                        open: event_data.open
                    }
                };

                if (event_data.user_id && find_result.user_id.indexOf(event_data.user_id) < 0) {
                    update_option['$push'] = {
                        user_id: event_data.user_id
                    }
                }
                if (event_data.open && event_data.id.indexOf('__' + event_data.user_id) < 0) {
                    update_option['$set'].id = event_data.id + '__' + event_data.user_id;
                    var start_date = new Date(new Date(event_data.start).getTime() + 3600*9*1000).toISOString();
                    var end_date = new Date(new Date(event_data.start).getTime() + 3600*9*1000).toISOString();
                    update_option['$set'].open_day = start_date.substring(0, start_date.indexOf('T'));
                    update_option['$set'].close_day = end_date.substring(0, end_date.indexOf('T'));
                } else if (event_data.open !== find_result.open) {
                    update_option['$set'].id = event_data.id.substring(0, event_data.id.indexOf('__' + event_data.user_id));
                }
                db_event.update({
                    id: event_data.id
                }, update_option, function(update_err, result) {
                    res.json({
                        err: update_err,
                        result: result
                    });
                });
            } else if (!find_err) {
                event_data.Allday = String(event_data.Allday) == 'true';
                event_data.open = String(event_data.open) == 'true';
                event_data.user_id = [event_data.user_id];
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
    } else if (req.body.events && req.body.events.length) { // for import events from google calendar
        var events = req.body.events;
        async.mapLimit(events, 10, function(item, next) {
            item.Allday = String(item.Allday) == 'true';
            item.open = String(item.open) == 'true';
            db_event.findOne({
                id: item.id
            }, function(find_err, find_result) {
                if (!find_err && find_result) {
                    db_event.remove({
                        id: item.id
                    }, function(remove_err, remove_result) {
                        next(remove_err, item);
                    });
                } else {
                    next(find_err, item);
                }
            });
        }, function(async_err, results) {
            db_event.insertMany(results, function(err, result) {
                res.json({
                    err: async_err || err,
                    result: result
                });
            });
        });
    }
};

exports.event_remove = function(req, res) {
    var db_event = req.app.get('db').collection('Heroes');
    db_event.remove(req.body, function(err, result) {
        if (err) console.log(err);
        if (req.body.id.indexOf('_by_user_' + req.session.user_id) > -1) {
            db_event.update({
                id: req.body.id.substring(0, req.body.id.indexOf('_by_user_'))
            }, {
                $pull: {
                    user_id: req.session.user_id
                }
            }, function(update_err, update_result) {
                if (update_err) console.log(update_err);
                res.json(update_err);
            });
        } else {
            res.json(null);
        }
    });
};

exports.event_edit = function(req, res) {
    if (req.params.id.indexOf('_by_user_') > -1 && req.params.id.indexOf('__') < 0) {
        console.log('Permission Denied');
        res.redirect('/calendar');
    } else {
        var db_event = req.app.get('db').collection('Heroes');
        db_event.findOne({
            id: req.params.id
        },function(err,result) {
            if (!err) {
                res.render('calendardata.edit.html', {
                    title: result.title || '',
                    start: result.start ? new Date(new Date(result.start).getTime() + 3600*9*1000).toISOString() : '',
                    end: result.end ? new Date(new Date(result.end).getTime() + 3600*9*1000).toISOString() : '',
                    Allday: String(result.Allday) == 'true',
                    place: result.place || {lat: null, lng: null},
                    description: result.description || '',
                    open: String(result.open) == 'true',
                });
            }
            else {
                console.log("error in one_get function: ", err);
            }
        });
    }
};

exports.get_open_event = function(req, res) {
    var db_event = req.app.get('db').collection('Heroes');
    db_event.find({
        open: true,
        user_id: {
            $ne: req.session.user_id
        }
    }, {
        _id: 0
    }).toArray(function(err, results) {
        if (err) {
            console.log(err);
            res.json(null);
        } else {
            // Add more..?
            res.json(results);
        }
    });
};

exports.add_open_event = function(req, res) {
    var db_event = req.app.get('db').collection('Heroes');
    var user_id = req.session.user_id;
    var need_day_select = !!req.body.selected_day;
    var selected_date = need_day_select ? new Date(new Date(req.body.selected_day).getTime() + 3600*9*1000).toISOString() : '';
    var selected_day = need_day_select ? selected_date.substring(0, selected_date.indexOf('T')) : '';
    db_event.findOne({
        id: req.body.id,
        open: true
    }, {
        _id: 0
    }, function(find_err, find_result) {
        if (find_err) {
            res.json(find_err);
        } else {
            db_event.update({
                id: req.body.id
            }, {
                $push: {
                    user_id: user_id
                }
            }, function(open_update_err, open_update_result) {
                if (open_update_err) {
                    res.json(open_update_err);
                } else {
                    var start_date = find_result.start;
                    var end_date = find_result.end;
                    var start_time = need_day_select ? start_date.substring(start_date.indexOf('T'), start_date.length) : start_date;
                    var end_time = need_day_select ? end_date.substring(end_date.indexOf('T'), end_date.length) : end_date;
                    find_result.id += '_by_user_' + user_id;
                    find_result.start = selected_day + start_time;
                    find_result.end = selected_day + end_time;
                    delete find_result.open_day;
                    delete find_result.close_day;
                    find_result.open = false;
                    find_result.user_id = [user_id];
                    db_event.insertOne(find_result, function(insert_err, insert_result) {
                        res.json(insert_err);
                    });
                }
            });
        }
    });
};

exports.recommend_event = function(req, res) {
    var db_event = req.app.get('db').collection('Heroes');
    var now_date = new Date();
    var now_string = now_date.toISOString();
    var now_day = new Date(now_string.substring(0, now_string.indexOf('T'))).toISOString();
    var final_date = new Date(now_date.getTime() + 3600 * 1000 * 24 * 7);
    var final_string = final_date.toISOString();
    var final_day = new Date(final_string.substring(0, final_string.indexOf('T'))).toISOString();
    db_event.find({
        open: true,
        user_id: {
            $ne: req.session.user_id
        },
        end: {
            $gt: now_string
        },
        start: {
            $lt: final_string
        },
        open_day: {
            $lt: final_day
        },
        close_day: {
            $gt: now_day
        }
    }, {
        _id: 0
    }).toArray(function(err, open_events) {
        if (err) {
            console.log(err);
            res.json(null);
        } else {
            db_event.find({
                user_id: req.session.user_id,
                open: true,
                category: {$exists: true}
            }, {
                category: 1
            }).toArray(function(category_err, category_results) {
                if (category_err) {
                    console.log(category_err);
                    res.json(null);
                } else {
                    var category = {
                        '콘서트': 0,
                        '축제': 0,
                        '모임': 0,
                        '설명회': 0,
                        '뮤지컬': 0,
                        '전시': 0,
                        '연극': 0,
                        '기타': 0
                    };
                    category_results.map(function(val) {
                        category[val.category]++;
                    });

                    db_event.find({
                        $or: [{
                            user_id: req.session.user_id,
                            end: {
                                $gt: now_string
                            },
                            start: {
                                $lt: final_string
                            },
                            open: false
                        }, {

                            user_id: req.session.user_id,
                            end: {
                                $gt: now_string
                            },
                            start: {
                                $lt: final_string
                            },
                            open: true,
                            id: new RegExp('__' + req.session.user_id + '$')
                        }]
                    },{
                        id :1,
                        start : 1,
                        end: 1,
                        place : 1
                    }).sort({start: -1}).toArray(function(_err, user_events) {
                        if (_err) {
                            console.log(_err);
                            res.json(null);
                        } else {
                            var event_score = [];
                            var now_time = now_date.getTime();
                            var get_distance = function(prev_place, next_place) {
                                if (prev_place && prev_place.lat && next_place && next_place.lat) {
                                    var lat1 = prev_place.lat;
                                    var lon1 = prev_place.lng;
                                    var lat2 = next_place.lat;
                                    var lon2 = next_place.lng;
                                    var pi_180 = 0.017453292519943295;    // Math.PI / 180
                                    var cos = Math.cos;
                                    var a = 0.5 - cos((lat2 - lat1) * pi_180)/2 + cos(lat1 * pi_180) * cos(lat2 * pi_180) * (1 - cos((lon2 - lon1) * pi_180))/2;
                                    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
                                } else {
                                    return null;
                                }
                            };
                            
                            open_events.map(function(open_e) {
                                event_score[open_e.id] = 0;
                                var open_len_time = new Date(open_e.close_day).getTime() - new Date(open_e.open_day).getTime();
                                var open_len = parseInt(open_len_time / 86400000, 10) + 1;
                                if (open_len > 7) {
                                    open_len_time = 86400000 * 7;
                                    open_len = 7;
                                }
                                var open_e_start, open_e_end;
                                if (new Date(open_e.open_day).getTime() < new Date(now_day).getTime()) {
                                    open_e_start = new Date(open_e.start).getTime() - new Date(open_e.open_day).getTime() + new Date(now_day).getTime()
                                } else {
                                    open_e_start = new Date(open_e.start).getTime();
                                }
                                if (new Date(open_e.close_day).getTime() > new Date(final_day).getTime()) {
                                    open_e_end = new Date(open_e.end).getTime() - open_len_time + 86400000 - new Date(open_e.close_day).getTime() + new Date(final_day).getTime();
                                } else {
                                    open_e_end = new Date(open_e.end).getTime() - open_len_time + 86400000;
                                }
                                var open_e_total = open_e_end - open_e_start;
                                var time_score = 30;
                                var place_score = 30;
                                
                                if (user_events && user_events.length) {
                                    for (var i = 0; i < open_len; i++) {
                                        var inner_open_e_start = open_e_start + (i * 86400000);
                                        var inner_open_e_end = open_e_end + (i * 86400000);
                                        var overlap = 0;
                                        var prev_user_e = user_events[0], next_user_e = user_events[user_events.length-1];
                                        var prev_gap = next_gap = 86400000 * 7;
                                        user_events.map(function(user_e, idx) {
                                            var user_e_start = new Date(user_e.start).getTime();
                                            var user_e_end = new Date(user_e.end).getTime();
                                            var user_e_overlap;
                                            if (inner_open_e_end <= user_e_start || inner_open_e_start >= user_e_end) {
                                                // no overlap
                                                user_e_overlap = 0;
                                            } else {
                                                if (inner_open_e_start >= user_e_start && inner_open_e_end <= user_e_end) {
                                                    // all overlap
                                                    user_e_overlap = open_e_total;
                                                } else {
                                                    //some overlap
                                                    if (inner_open_e_start <= user_e_start && inner_open_e_end >= user_e_end) {
                                                        user_e_overlap = user_e_end - user_e_start;
                                                    } else {
                                                        if (inner_open_e_start <= user_e_start) {
                                                            user_e_overlap = inner_open_e_end - user_e_start;
                                                        } else {
                                                            user_e_overlap = user_e_end - inner_open_e_start;
                                                        }
                                                    }
                                                }
                                            }
                                            if (0 < inner_open_e_start - user_e_end < prev_gap) {
                                                prev_gap = inner_open_e_start - user_e_end;
                                                prev_user_e = user_e;
                                            } else if (0 < user_e_start - inner_open_e_end < next_gap) {
                                                next_gap = user_e_start - inner_open_e_end;
                                                next_user_e = user_e;
                                            }
                                            overlap += user_e_overlap;
                                        });
                                        var inner_time_score = parseInt(overlap / open_e_total / 1000 * 30000, 10);
                                        var inner_place_score = 30;
                                        var dist1 = get_distance(prev_user_e.place, open_e.place);
                                        var dist2 = get_distance(open_e.place, next_user_e.place);
                                        if (dist1 !== null && dist2 !== null) {
                                            if (dist1 > 12) dist1 = 12;
                                            if (dist2 > 12) dist2 = 12;
                                            inner_place_score = parseInt((dist1 + dist2) / 24 / 1000 * 30000, 10);
                                        } else if (dist1 !== null || dist2 !== null) {
                                            if (dist1 == null) dist1 = dist2;
                                            else if (dist2 == null) dist2 = dist1;
                                            inner_place_score = parseInt((dist1 + dist2) / 24 / 1000 * 30000, 10);
                                        } else {
                                            inner_place_score = 30;
                                        }
                                        if (time_score > inner_time_score) {
                                            time_score = inner_time_score;
                                        }
                                        if (place_score > inner_place_score) {
                                            place_score = inner_place_score;
                                        }
                                    }
                                } else {
                                    time_score = 0;
                                    place_score = 0;
                                }
                                var category_score = open_e.category && category_results.length ? 40 - parseInt(category[open_e.category] / category_results.length / 1000 * 40000, 10) : 40;
                                console.log(open_e.title, time_score, place_score, category_score);
                                event_score[open_e.id] = time_score + place_score + category_score;
                            });

                            var sorted_results = open_events.sort(function(a, b) {
                                return event_score[a.id] - event_score[b.id];
                            });
                        
                            res.json(sorted_results);
                        }
                    });
                }
            });
        }
    });
};
