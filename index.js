'use strict';

const express = require('express');
const app = express();
app.set('view engine', 'pug');

// Get Payload class
const Payload = require('./payload');
// Initialize class
const payload = new Payload(app);

// Must add payload views here
app.set('views', [`${__dirname}/views`, payload.views]);

app.get('/', (req, res) => res.render('index',
  {
    title: 'Index'
  }));

app.listen(3000, () => console.log('Example app listening on http://localhost:3000'))