const express = require('express');
const requestHandlers = require('./requestHandlers');
const bindCollectionMiddleware = require('./bindCollection');

const {
  find, create, findByID, deleteHandler, update,
} = requestHandlers;

const router = express.Router();

const registerRoutes = ({ Model, config }) => {
  router.all(`/${config.slug}*`,
    bindCollectionMiddleware({ Model, config }));

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
