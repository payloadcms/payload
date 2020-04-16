const express = require('express');
const Payload = require('../src');
const config = require('./payload.config');

const expressApp = express();

const payload = new Payload({
  config,
  express: expressApp,
});

exports.payload = payload;

exports.start = (cb) => {
  const server = expressApp.listen(config.port, () => {
    console.log(`listening on ${config.port}...`);
    if (cb) cb();
  });

  return server;
};

// when app.js is launched directly
if (module.id === require.main.id) {
  exports.start();
}
