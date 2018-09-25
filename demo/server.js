const mongoose = require('mongoose');
const express = require('express');
// const Payload = require('../dist');
const bodyParser = require('body-parser');
const payloadConfig = require('./payload.config');

mongoose.connect(payloadConfig.mongoURL);

const app = module.exports = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Headers',
    'Origin X-Requested-With, Content-Type, Accept');
  next();
});

app.use(bodyParser.json());

app.get('/test', (req, res) => {
  res.sendStatus(200);
});

require(payloadConfig.dir.models);
require(payloadConfig.dir.api);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
