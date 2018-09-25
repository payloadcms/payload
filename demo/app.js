const mongoose = require('mongoose');
const express = require('express');
const payloadConfig = require('./payload.config');

const routes = require(payloadConfig.dir.server);

mongoose.connect(payloadConfig.mongoURL);

const app = module.exports = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/', routes);

// require(payloadConfig.dir.models);
// require(payloadConfig.dir.server);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
  console.log(app._router.stack);
});
