const mongoose = require('mongoose');
const express = require('express');
// const Payload = require('../dist');
const bodyParser = require('body-parser');
const payloadConfig = require('./payload.config');

mongoose.connect(payloadConfig.mongoURL);

const app = module.exports = express();

app.use(bodyParser.json());

app.get('/test', (req, res) => {
  res.sendStatus(200);
});

require(payloadConfig.dir.models);
require(payloadConfig.dir.api);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
