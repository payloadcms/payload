const mongoose = require('mongoose');
const express = require('express');
const payloadConfig = require('./payload.config');
const router = express.Router({}); // eslint-disable-line new-cap
const app = module.exports = express();

mongoose.connect(payloadConfig.mongoURL, { useNewUrlParser: true }, (err) => {
  if (err) {
    console.log('Unable to connect to the Mongo server. Please start the server. Error:', err);
  } else {
    console.log('Connected to Mongo server successfully!');
  }
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Headers',
    'Origin X-Requested-With, Content-Type, Accept');
  next();
});

const authRoutes = require('./Auth/Auth.routes');
router.use('', authRoutes);

const pageRoutes = require('./Page/Page.routes');
router.use('/pages', pageRoutes);

// Not scaffolded, but this is how it works
// const orderRoutes = require('./Order/Order.routes');
// router.use('/orders', orderRoutes);

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(router);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
