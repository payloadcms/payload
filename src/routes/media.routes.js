import express from 'express';
import passport from 'passport';
import uploadsCtrl from '../controllers/uploads.controller';
import { query } from '../requestHandlers';
import bindModel from '../middleware/bindModel';
import Media from '../models/Media.model';

const router = express.Router();
const mediaRoutes = config => {

  router.all('*', bindModel(Media));

  router
    .route('')
    .post(
      passport.authenticate('jwt', { session: false }),
      (req, res, next) => uploadsCtrl.upload(req, res, next, config)
    );

  router.route('')
    .get(
      passport.authenticate('jwt', { session: false }),
      query
    );

  return router;
};

export default mediaRoutes;
