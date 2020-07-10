const express = require('express');

const requestHandlers = require('./requestHandlers');
const bindCollectionMiddleware = require('./bindCollection');

const {
  find, create, findByID, deleteHandler, update,
} = requestHandlers;

const router = express.Router();

const registerRoutes = (collection, config) => {
  router.all(`/${collection.config.slug}*`, bindCollectionMiddleware(collection));

  router.route(`/${collection.config.slug}`)
    .get(find(config))
    .post(create(config));

  router.route(`/${collection.config.slug}/:id`)
    .get(findByID(config))
    .put(update(config))
    .delete(deleteHandler(config));

  return router;
};

module.exports = registerRoutes;
