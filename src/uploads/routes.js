const express = require('express');
const fileUpload = require('express-fileupload');
const { upload, update } = require('./requestHandlers');
const bindCollectionMiddleware = require('../collections/bindCollection');
const authenticate = require('../express/middleware/authenticate');

const router = express.Router();

const uploadRoutes = (collection) => {
  const { config } = collection;

  router.all(`/${config.slug}*`,
    fileUpload(),
    authenticate,
    bindCollectionMiddleware(collection));

  router.route(`/${config.slug}`).post(upload);
  router.route(`/${config.slug}/:id`).put(update);

  return router;
};

module.exports = uploadRoutes;
