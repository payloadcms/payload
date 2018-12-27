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

// Sample role authentication
// TODO: Turn into proper middleware
router
  .route('/role/:role')
  .get(passport.authenticate('jwt', { session: false }), (req, res, next) => {
    console.log(`Attempted role: ${req.params.role}`);
    console.log(`Actual role: ${req.user.role}`);
    if (req.params.role === req.user.role) next();
    next('route');
  }, authCtrl.me);


export default router;
