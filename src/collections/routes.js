const express = require('express');
const fileUpload = require('express-fileupload');

const requestHandlers = require('./requestHandlers');
const bindCollectionMiddleware = require('./bindCollection');

const {
  find, create, findByID, deleteHandler, update,
} = requestHandlers;

const router = express.Router();

const registerRoutes = ({ Model, config }) => {
  const middleware = [
    bindCollectionMiddleware({ Model, config }),
  ];

  if (config.upload) {
    middleware.push(fileUpload());
  }

  router.all(`/${config.slug}*`, ...middleware);

  router.route(`/${config.slug}`)
    .get(find)
    .post(create);

  router.route(`/${config.slug}/:id`)
    .get(findByID)
    .put(update)
    .delete(deleteHandler);

  return router;
};

module.exports = registerRoutes;
