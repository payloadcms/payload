const express = require('express');

function initStatic() {
  this.config.collections.forEach((collection) => {
    if (collection.upload) {
      this.express.use(`${collection.upload.staticURL}*`, express.static(collection.upload.staticDir));
    }
  });
}

module.exports = initStatic;
