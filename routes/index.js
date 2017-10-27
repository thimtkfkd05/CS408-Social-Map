
/*
 * GET home page.
 */

exports.index = function(req, res){
  //res.render('index', { title: 'Express' });
  res.redirect('/recommendation');
};

exports.calendar = function(req, res){
    res.render('calendar.html');
};

exports.recommendation = function(req, res){
    res.render('recommendation.html');
};
