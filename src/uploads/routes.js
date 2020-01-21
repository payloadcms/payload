const passport = require('passport');
const fileUpload = require('express-fileupload');
const { upload, update } = require('./requestHandlers');
const uploadMiddleware = require('./middleware');
const setModelLocaleMiddleware = require('../localization/setModelLocale');

const uploadRoutes = (Upload, config, router) => {
  const { upload: uploadConfig } = config;

  router.all(`/${uploadConfig.slug}*`,
    fileUpload(),
    passport.authenticate('jwt', { session: false }),
    uploadMiddleware(config, Upload),
    setModelLocaleMiddleware());

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
