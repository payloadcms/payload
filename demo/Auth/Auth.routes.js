import express from 'express';
import passport from 'passport';
import authValidate from '../../src/auth/validate';
import middleware from '../../src/middleware';
import authCtrl from './Auth.controller';

const router = new express.Router();

router
  .route('/login')
  .post(authValidate.login, authCtrl.login);

router
  .route('/me')
  .post(passport.authenticate('jwt', { session: false }), authCtrl.me);

router
  .route('/role/:role')
  .get(passport.authenticate('jwt', { session: false }), middleware.role, authCtrl.me);

// TODO: Find a way to do "middleware.role('admin')", can't figure this out currently
// router
//   .route('/adminonly')
//   .get(passport.authenticate('jwt', { session: false }), , authCtrl.me);


export default router;
