const mongoose = require('mongoose');
const express = require('express');
const Payload = require('../dist');
const payloadConfig = require('./payload.config');

mongoose.connect(payloadConfig.mongoURL);

const app = module.exports = express();

app.get('/test', (req, res) => {
  res.sendStatus(200);
});

require(payloadConfig.dir.api);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
