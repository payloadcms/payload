const mongoose = require('mongoose');
const collectionRoutes = require('./routes');
const buildSchema = require('./buildSchema');
const sanitize = require('./sanitize');

function registerCollections() {
  this.config.collections.forEach((collection) => {
    this.collections[collection.slug] = {
      Model: mongoose.model(collection.slug, buildSchema(collection, this.config)),
      config: sanitize(this.collections, collection),
    };

    this.router.use(collectionRoutes(this.collections[collection.slug]));
  });
}

module.exports = registerCollections;
