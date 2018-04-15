'use strict';

const express = require('express');
const app = express();
app.set('view engine', 'pug');

const Payload = require('./payload');
const payload = new Payload(app);

app.set('views', [`${__dirname}/views`, payload.views]);

app.get('/', (req, res) => res.render('index',
  {
    title: 'Index'
  }));

app.listen(3000, () => console.log('Example app listening on http://localhost:3000'))