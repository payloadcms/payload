const express = require('express');
const requestHandlers = require('./requestHandlers');
const bindModelMiddleware = require('../express/middleware/bindModel');
const getMiddleware = require('./middleware');

const { upsert, findOne } = requestHandlers;

const router = express.Router();

const registerGlobals = (globalConfigs, Globals) => {
  router.all('/globals*',
    bindModelMiddleware(Globals));

  globalConfigs.forEach((global) => {
    router.all(`/globals/${global.slug}`, getMiddleware(global));

    router
      .route(`/globals/${global.slug}`)
      .get(findOne)
      .post(upsert)
      .put(upsert);
  });

  return router;
};

module.exports = registerGlobals;
