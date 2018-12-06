import express from 'express';
import passport from 'passport';
import authValidate from '../../src/auth/validate';
import authCtrl from './Auth.controller';

const router = new express.Router();

router
  .route('/login')
  .post(authValidate.login, passport.authenticate('local'), authCtrl.login);

export default router;
