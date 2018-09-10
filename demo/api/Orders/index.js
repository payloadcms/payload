var app = require('../../server');

app.get('/orders', (req, res) => {
  res.sendStatus(200);
});

app.post('/orders', (req, res) => {
  res.sendStatus(200);
});
