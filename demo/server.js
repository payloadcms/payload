/* eslint-disable no-console */
const express = require('express');
const path = require('path');
const payload = require('../src');
const logger = require('../src/utilities/logger')();

const expressApp = express();

expressApp.use('/static', express.static(path.resolve(__dirname, 'client/static')));

payload.init({
  email: {
    transport: 'mock',
  },
  secret: 'SECRET_KEY',
  mongoURL: 'mongodb://localhost/payload',
  express: expressApp,
  onInit: () => {
    logger.info('Payload is initialized');
    // console.log('Payload is initialized');
  },
});

const externalRouter = express.Router();

externalRouter.use(payload.authenticate);

externalRouter.get('/', (req, res) => {
  if (req.user) {
    return res.send(`Authenticated successfully as ${req.user.email}.`);
  }

  return res.send('Not authenticated');
});

expressApp.use('/external-route', externalRouter);

exports.start = (cb) => {
  const server = expressApp.listen(3000, async () => {
    logger.info(`listening on ${3000}...`);
    if (cb) cb();

    const creds = await payload.getMockEmailCredentials();
    logger.info(`Mock email account username: ${creds.user}`);
    logger.info(`Mock email account password: ${creds.pass}`);
    logger.info(`Log in to mock email provider at ${creds.web}`);
  });

  return server;
};

// when server.js is launched directly
if (module.id === require.main.id) {
  exports.start();
}
