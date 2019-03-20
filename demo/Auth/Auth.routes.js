import express from 'express';
import passport from 'passport';
import authValidate from '../../src/auth/validate';
import middleware from '../../src/middleware';
import authCtrl from './Auth.controller';
import payloadConfig from '../payload.config';

const authRoutes = express.Router();

authRoutes
  .route('/login')
  .post(authValidate.login, authCtrl.login);

authRoutes
  .route('/me')
  .post(passport.authenticate('jwt', { session: false }), authCtrl.me);

payloadConfig.roles.forEach((role) => {
  authRoutes
    .route(`/role/${role}`)
    .get(passport.authenticate('jwt', { session: false }), middleware.role(role), authCtrl.me);
});

export { authRoutes };
