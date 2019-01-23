import express from 'express';
import passport from 'passport';
import uploadsCtrl from '../controllers/uploads.controller';

const router = new express.Router();
const uploadRouter = config => {
  router
    .route('')
    .post(
      passport.authenticate('jwt', { session: false }),
      (req, res, next) => uploadsCtrl.upload(req, res, next, config)
    );

  return router;
};

export default uploadRouter;
