const express = require('express');
const passport = require('passport');
const fileUpload = require('express-fileupload');
const { upload, update } = require('./requestHandlers');
const uploadMiddleware = require('./middleware');

const router = express.Router();

const uploadRoutes = (config, Upload) => {
  const { config: uploadConfig, Model } = Upload;

  router.all(`/${uploadConfig.slug}*`,
    fileUpload(),
    passport.authenticate('jwt', { session: false }),
    uploadMiddleware(config, Model));

  router.route(`/${uploadConfig.slug}`)
    .post(
      (req, res, next) => upload(req, res, next, config),
    );

  router.route(`/${uploadConfig.slug}/:id`)
    .put(
      (req, res, next) => update(req, res, next, config),
    );

  return router;
};

module.exports = uploadRoutes;
