const express = require('express');
const getExecuteStaticPolicy = require('../auth/getExecuteStaticPolicy');

function initStatic() {
  Object.entries(this.collections).forEach(([_, collection]) => {
    const { config } = collection;

    if (config.upload) {
      this.express.use(`${config.upload.staticURL}`, getExecuteStaticPolicy(collection));
      this.express.use(`${config.upload.staticURL}`, express.static(config.upload.staticDir));
    }
  });
}

module.exports = initStatic;
