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
  expressApp.listen(config.port, () => {
    console.log(`listening on ${config.port}...`);
    if (cb) cb();
  });
};

exports.close = (cb) => {
  if (expressApp) expressApp.close(cb);
};

// when app.js is launched directly
if (module.id === require.main.id) {
  exports.start();
}
