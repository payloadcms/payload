var path = require('path');
var payload = require('./payload');

const express = require('express');
const app = express();
app.set('view engine', 'pug');

var payloadBootstrap = payload(app);
app.set('views', [__dirname + '/views', payloadBootstrap.views]);
app.get('/', (req, res) => res.render('index',
  {
    title: 'Index'
  }));

app.listen(3000, () => console.log('Example app listening on port 3000!'))