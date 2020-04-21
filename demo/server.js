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
  const server = expressApp.listen(config.port, async () => {
    console.log(`listening on ${config.port}...`);
    if (cb) cb();

    if (config.email.provider === 'mock') {
      const creds = await payload.getMockEmailCredentials();
      console.log(`Mock email account username: ${creds.user}`);
      console.log(`Mock email account password: ${creds.pass}`);
      console.log(`Log in to mock email provider at ${creds.web}`);
    }
  });

  return server;
};

// when app.js is launched directly
if (module.id === require.main.id) {
  exports.start();
}
