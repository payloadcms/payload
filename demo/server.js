var mongoose = require('mongoose');
var express = require('express');
var payloadConfig = require('./payload.config');

mongoose.connect(payloadConfig.mongoURL);

var app = module.exports = express();

app.get('/test', (req, res) => {
  res.sendStatus(200);
});

require(payloadConfig.dir.api);

app.listen(payloadConfig.port, (error) => {
  console.log("listening on " + payloadConfig.port + "...");
})
