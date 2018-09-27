const payload = require('../dist');

const mongoose = require('mongoose');
const express = require('express');
const payloadConfig = require('./payload.config');

const routes = require(payloadConfig.dir.server);

mongoose.connect(payloadConfig.mongoURL);

const app = module.exports = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/', routes);
payload.init(app, mongoose, payloadConfig);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
