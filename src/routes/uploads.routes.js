import express from 'express';
import passport from 'passport';
import uploadsCtrl from '../controllers/uploads.controller';

const router = new express.Router();

router
  .route('')
  .post(passport.authenticate('jwt', { session: false }), uploadsCtrl.upload);

export default router;
