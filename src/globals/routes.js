const express = require('express');
const requestHandlers = require('./requestHandlers');

const { upsert, findOne } = requestHandlers;

const router = express.Router();

const registerGlobals = (globalConfigs, Globals) => {
  globalConfigs.forEach((global) => {
    router
      .route(`/globals/${global.slug}`)
      .get(findOne(Globals.Model, global))
      .post(upsert(Globals.Model, global))
      .put(upsert(Globals.Model, global));
  });

  return router;
};

module.exports = registerGlobals;
