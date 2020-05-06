const mongoose = require('mongoose');
const collectionRoutes = require('./routes');
const buildSchema = require('./buildSchema');
const sanitize = require('./sanitize');
const uploadRoutes = require('../uploads/routes');

function registerCollections() {
  this.config.collections.forEach((collection) => {
    const schema = buildSchema(collection, this.config);

    if (collection.upload) {
      const uploadFields = {
        filename: {
          type: String,
          unique: true,
          required: true,
        },
        mimeType: { type: String },
        width: { type: Number },
        height: { type: Number },
      };

      if (collection.upload.imageSizes && Array.isArray(collection.upload.imageSizes)) {
        uploadFields.sizes = collection.upload.imageSizes.reduce((sizes, size) => {
          return {
            ...sizes,
            [size.name]: {
              width: { type: Number },
              height: { type: Number },
              filename: { type: String },
              _id: false,
            },
          };
        }, {});
      }

      schema.add(uploadFields);
    }

    this.collections[collection.slug] = {
      Model: mongoose.model(collection.slug, schema),
      config: sanitize(this.collections, collection),
    };

    if (collection.upload) {
      this.router.use(uploadRoutes(this.collections[collection.slug]));
    }

    this.router.use(collectionRoutes(this.collections[collection.slug]));
  });
}

module.exports = registerCollections;
