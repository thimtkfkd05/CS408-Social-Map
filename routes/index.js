
/*
 * GET home page.
 */

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

// modules.exports = function (app) {
//   app.get('', function(req, res){
//     res.end();
//   });
// };