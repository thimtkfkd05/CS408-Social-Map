
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.calendar = function(req, res){
    res.render('calendar.html');
};
