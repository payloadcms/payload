import express from 'express';
import passport from 'passport';
import authValidate from '../../src/auth/validate';
import authCtrl from './Auth.controller';

const router = new express.Router();

router
  .route('/login')
  .post(authValidate.login, authCtrl.login);

router
  .route('/me')
  .post(passport.authenticate('jwt', { session: false }), authCtrl.me);

export default router;
