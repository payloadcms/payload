const express = require('express');
const Payload = require('../');
const config = require('./payload.config');

const router = express.Router({}); // eslint-disable-line new-cap

const app = express();

const payload = new Payload({
  config,
  app,
  router,
});

app.listen(config.port, () => {
  console.log(`listening on ${config.port}...`);
});
