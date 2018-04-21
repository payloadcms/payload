'use strict';

const express = require('express');
const app = express();
const mongoose = require('mongoose');
app.set('view engine', 'pug');

// Get Payload class
const Payload = require('./payload');
// Initialize class
const payload = new Payload({
  express: app,
  mongoose,
  baseURL: 'base123'
});

// Sample collection creation
let coolCollection = payload.newCollection('cool');
coolCollection.add({
  test: { testProp: 'one', testProp2: 'two' }
});
coolCollection.register();

// Retrieve collection
let retrievedCollection = payload.getCollection('cool');
console.log(`Retrieved ${retrievedCollection.key} collection`);
console.log(`testProp: ${coolCollection.fields.test.testProp}`);

// Must add payload views here
app.set('views', [`${__dirname}/views`, payload.views]);

app.get('/', (req, res) => res.render('index',
  {
    title: 'Index'
  }));

app.listen(3000, () => console.log('Example app listening on http://localhost:3000'))