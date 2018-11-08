const express = require('express');
const passport = require('passport');
const authValidate = require('../../src/auth/validate');
const authCtrl = require('./Auth.controller');

const router = new express.Router();

router
  .route('/login')
  .post(authValidate.login, passport.authenticate('local'), authCtrl.login);

module.exports = router;
