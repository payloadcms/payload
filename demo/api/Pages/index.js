var app = require('../../server');

app.get('/pages', (req, res) => {

  // var filtered = payload.filter(req);

  // if (payload.auth) {
    res.sendStatus(200);
  // }

  res.sendStatus(401);
});

app.post('/pages', (req, res) => {
  res.sendStatus(200);
});
