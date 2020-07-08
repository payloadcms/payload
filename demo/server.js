const express = require('express');
const path = require('path');
const Payload = require('../src');

const expressApp = express();

expressApp.use('/static', express.static(path.resolve(__dirname, 'client/static')));

const payload = new Payload({
  email: {
    provider: 'mock',
  },
  secret: 'SECRET_KEY',
  mongoURL: 'mongodb://localhost/test',
  express: expressApp,
});

const externalRouter = express.Router();

externalRouter.use(payload.authenticate());
externalRouter.get('/', (req, res) => {
  if (req.user) {
    return res.send(`Authenticated successfully as ${req.user.email}.`);
  }

  return res.send('Not authenticated');
});

expressApp.use('/external-route', externalRouter);

exports.payload = payload;

exports.start = (cb) => {
  const server = expressApp.listen(3000, async () => {
    console.log(`listening on ${3000}...`);
    if (cb) cb();

    const creds = await payload.getMockEmailCredentials();
    console.log(`Mock email account username: ${creds.user}`);
    console.log(`Mock email account password: ${creds.pass}`);
    console.log(`Log in to mock email provider at ${creds.web}`);
  });

  return server;
};

// when server.js is launched directly
if (module.id === require.main.id) {
  exports.start();
}
