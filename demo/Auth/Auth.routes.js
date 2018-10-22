const express = require('express');
const validate = require('express-validation');
const passport = require('passport');
const paramValidation = require('./Auth.validations');
const authCtrl = require('./Auth.controller');

const router = express.Router(); // eslint-disable-line new-cap

router
  .route('/login')
  .post(validate(paramValidation.login), passport.authenticate('local'), authCtrl.login);

router
  .route('/register')
  .post(validate(paramValidation.register), authCtrl.register);

module.exports = router;
