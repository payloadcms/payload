const express = require('express');
const requestHandlers = require('./requestHandlers');
const bindModelMiddleware = require('../express/middleware/bindModel');
const loadPolicy = require('../express/middleware/loadPolicy');
const bindCollectionMiddleware = require('./bindCollection');

const {
  find, create, findByID, deleteHandler, update,
} = requestHandlers;

const router = express.Router();

const registerRoutes = ({ model, config }) => {
  router.all(`/${config.slug}*`,
    bindModelMiddleware(model),
    bindCollectionMiddleware(config));

  router.route(`/${config.slug}`)
    .get(loadPolicy(config.policies.read), find)
    .post(loadPolicy(config.policies.create), create);

  router.route(`/${config.slug}/:id`)
    .get(loadPolicy(config.policies.read), findByID)
    .put(loadPolicy(config.policies.update), update)
    .delete(loadPolicy(config.policies.delete), deleteHandler);

  return router;
};

module.exports = registerRoutes;
