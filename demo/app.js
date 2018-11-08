const express = require('express');
const payload = require('../src');
const User = require('./User/User.model');
const payloadConfig = require('./payload.config');
const router = express.Router({}); // eslint-disable-line new-cap
const app = module.exports = express();

payload.init({
  config: payloadConfig,
  app: app,
  user: User,
  router: router
});

const authRoutes = require('./Auth/Auth.routes');
router.use('', authRoutes);

const userRoutes = require('./User/User.routes');
router.use('/users', userRoutes);

const pageRoutes = require('./Page/Page.routes');
router.use('/pages', pageRoutes);

// Not scaffolded, but this is how it works
// const orderRoutes = require('./Order/Order.routes');
// router.use('/orders', orderRoutes);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
