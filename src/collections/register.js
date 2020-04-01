const mongoose = require('mongoose');
const collectionRoutes = require('./routes');
const validate = require('./validate');
const buildSchema = require('./buildSchema');

function registerCollections() {
  this.config.collections.forEach((collection) => {
    validate(collection, this.collections);

    this.collections[collection.slug] = {
      model: mongoose.model(collection.slug, buildSchema(collection, this.config)),
      config: collection,
    };

    this.router.use(collectionRoutes(this.collections[collection.slug]));
  });
}

module.exports = registerCollections;
