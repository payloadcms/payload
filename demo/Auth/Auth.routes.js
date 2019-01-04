import express from 'express';
import passport from 'passport';
import authValidate from '../../src/auth/validate';
import middleware from '../../src/middleware';
import authCtrl from './Auth.controller';
import payloadConfig from '../payload.config';

const router = new express.Router();

router
  .route('/login')
  .post(authValidate.login, authCtrl.login);

router
  .route('/me')
  .post(passport.authenticate('jwt', { session: false }), authCtrl.me);

payloadConfig.roles.forEach((role) => {
  router
    .route(`/role/${role}/only`)
    .get(passport.authenticate('jwt', { session: false }), middleware.role(role), authCtrl.me);
});

payloadConfig.roles.forEach((role) => {
  router
    .route(`/role/${role}/atleast`)
    .get(passport.authenticate('jwt', { session: false }),
      middleware.atLeastRole(payloadConfig.roles, role),
      authCtrl.me);
});

export default router;
