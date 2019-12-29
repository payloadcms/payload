import passport from 'passport';
import fileUpload from 'express-fileupload';
import { upload, update } from './requestHandlers';
import uploadMiddleware from './middleware';
import uploadModelLoader from './model';
import imageUploadModelLoader from './images/model';
import setModelLocaleMiddleware from '../localization/setModelLocale';

const uploadRoutes = (config, app, router) => {
  const Upload = uploadModelLoader(config);
  const UploadModels = {
    default: Upload,
    image: imageUploadModelLoader(Upload, config),
  };

  router.all('/upload*',
    fileUpload(),
    passport.authenticate('jwt', { session: false }),
    uploadMiddleware(config, UploadModels),
    setModelLocaleMiddleware());

  router.route('/upload')
    .post(
      (req, res, next) => upload(req, res, next, config),
    );

  router.route('/upload/:id')
    .put(
      (req, res, next) => update(req, res, next, config),
    );

  return router;
};

export default uploadRoutes;
