import express from 'express';
import passport from 'passport';
import mediaCtrl from '../controllers/media.controller';
import { query } from '../requestHandlers';
import bindModel from '../middleware/bindModel';
import mediaModelLoader from '../models/Media.model';

const router = express.Router();
const mediaRoutes = config => {

  const mediaModel = mediaModelLoader(config); // Needs config for intl
  router.all('*', bindModel(mediaModel));

  router
    .route('')
    .post(
      passport.authenticate('jwt', { session: false }),
      (req, res, next) => mediaCtrl.upload(req, res, next, mediaModel, config)
    );

  router
    .route(':id')
    .put(
      passport.authenticate('jwt', { session: false }),
      (req, res, next) => mediaCtrl.upload(req, res, next, mediaModel, config)
    );

  router.route('')
    .get(
      query
    );

  return router;
};

export default mediaRoutes;
