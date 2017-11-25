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

exports.google_login = function(req, res){
    var clientID = '468607746966-bqb4r002gsu8oavgsn2igh5hntoa295j.apps.googleusercontent.com';
    var secret = '13vFwW0UhoBA5XOqqiaYu5SG';
    var redirectURI = server_url + 'auth/google_access';

    var oauth2Client = new google.auth.OAuth2(clientID, secret, redirectURI);
    var scope = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.readonly'];

    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scope,
        include_granted_scopes: true,
        state: 'state_parameter_passthrough_value',
        response_type: 'code'
    });

    console.log(url);
    res.redirect(url);
};

exports.google_access = function(req, res){
    console.log(req.query); 

    res.redirect('/calendar');
};
