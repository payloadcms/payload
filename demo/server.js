const path = require('path');
const express = require('express');
const Payload = require('../src');
const privateConfig = require('./payload.private.config');

const expressApp = express();

const payload = new Payload({
  config: {
    public: path.resolve(__dirname, 'payload.public.config.js'),
    private: path.resolve(__dirname, 'payload.private.config.js'),
  },
  express: expressApp,
});

exports.payload = payload;

exports.start = (cb) => {
  const server = expressApp.listen(3000, async () => {
    console.log(`listening on ${3000}...`);
    if (cb) cb();

    if (privateConfig.email.provider === 'mock') {
      const creds = await payload.getMockEmailCredentials();
      console.log(`Mock email account username: ${creds.user}`);
      console.log(`Mock email account password: ${creds.pass}`);
      console.log(`Log in to mock email provider at ${creds.web}`);
    }
  });

  return server;
};

// when server.js is launched directly
if (module.id === require.main.id) {
  exports.start();
}
