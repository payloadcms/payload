const payload = require('../dist');

const mongoose = require('mongoose');
const express = require('express');
const payloadConfig = require('./payload.config');

const routes = require(payloadConfig.dir.server);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Headers',
    'Origin X-Requested-With, Content-Type, Accept');
  next();
});

mongoose.connect(payloadConfig.mongoURL, { useNewUrlParser: true }, (err) => {
  if (err) {
    console.log('Unable to connect to the Mongo server. Please start the server. Error:', err);
  } else {
    console.log('Connected to Mongo server successfully!');
  }
});

const app = module.exports = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/', routes);
payload.init(app);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
