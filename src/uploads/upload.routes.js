import express from 'express';
import {upload, update} from '../uploads/requestHandlers';
import uploadMiddleware from './upload.middleware';
import uploadModelLoader from './upload.model';
import imageUploadModelLoader from './images/image.model';
import setModelLocaleMiddleware from '../mongoose/setModelLocale.middleware';
import passport from 'passport';

const router = express.Router();

const uploadRoutes = config => {

  const Upload = uploadModelLoader(config);
  const UploadModels = {
    default: Upload,
    image: imageUploadModelLoader(Upload, config),
  };

  router.all('/upload*',
    passport.authenticate('jwt', {session: false}),
    uploadMiddleware(config, UploadModels),
    setModelLocaleMiddleware(),
  );

  router.route('/upload')
    .post(
      (req, res, next) => upload(req, res, next, config)
    );

  router.route('/upload/:id')
    .put(
      (req, res, next) => update(req, res, next, config)
    );

  return router;
};

export default uploadRoutes;
