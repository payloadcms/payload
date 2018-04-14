const path = require('path');

module.exports = function (app) {

  app.get('/login', function (req, res) {
    res.render('login',
    {
      title: 'Payload login'
    })
  });

  app.get('/admin', function (req, res) {
    res.send('GET page for Admin interface')
  });

  //  /payload/<model-name>/?arg1=blah&arg2=blah

  return {
    views: `${__dirname}\\views`
  }
}