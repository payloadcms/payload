const mongoose = require('mongoose');
const express = require('express');
const payload = require('../src');
const passport = require('passport');
const User = require('./User/User.model');
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

// configure passport for Auth
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Headers',
    'Origin X-Requested-With, Content-Type, Accept');
  next();
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

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(router);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
