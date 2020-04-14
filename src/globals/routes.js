const express = require('express');
const requestHandlers = require('./requestHandlers');

const { upsert, findOne } = requestHandlers;

const router = express.Router();

const registerGlobals = (globalConfigs, Globals) => {
  globalConfigs.forEach((global) => {
    router
      .route(`/globals/${global.slug}`)
      .get(findOne(Globals, global))
      .post(upsert(Globals, global))
      .put(upsert(Globals, global));
  });

  return router;
};

module.exports = registerGlobals;
