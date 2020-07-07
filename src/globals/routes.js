const express = require('express');
const requestHandlers = require('./requestHandlers');

const { update, findOne } = requestHandlers;

const router = express.Router();

const registerGlobals = (globalConfigs, Globals) => {
  globalConfigs.forEach((global) => {
    router
      .route(`/globals/${global.slug}`)
      .get(findOne(Globals, global))
      .post(update(Globals, global));
  });

  return router;
};

module.exports = registerGlobals;
