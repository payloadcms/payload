const express = require('express');
const Payload = require('../src');
const config = require('./payload.config');

const expressApp = express();

const payload = new Payload({
  config,
  express: expressApp,
});

expressApp.listen(config.port, () => {
  console.log(`listening on ${config.port}...`);
});
