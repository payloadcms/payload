const express = require('express');
const requestHandlers = require('./requestHandlers');

const { update, findOne } = requestHandlers;

const router = express.Router();

const registerGlobals = (config, Globals) => {
  config.globals.forEach((global) => {
    router
      .route(`/globals/${global.slug}`)
      .get(findOne(config, Globals, global))
      .post(update(config, Globals, global));
  });

  return router;
};

module.exports = registerGlobals;
