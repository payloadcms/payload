const mongoose = require('mongoose');
const collectionRoutes = require('../collections/routes');
const uploadRoutes = require('./routes');
const baseUploadFields = require('./baseUploadFields');
const baseImageFields = require('./baseImageFields');
const buildCollectionSchema = require('../collections/buildSchema');

function registerUpload() {
  // TODO: mongooseHidden on our upload model is hiding all the fields
  const uploadSchema = buildCollectionSchema(
    this.config.upload,
    this.config,
    { discriminatorKey: 'type' },
  );

  uploadSchema.add(baseUploadFields);

  const imageSchema = new mongoose.Schema(baseImageFields, {
    discriminatorKey: 'type',
  });

  this.Upload = mongoose.model(this.config.upload.labels.singular, uploadSchema);

  // TODO: image type hard coded, but in the future we need some way of customizing how uploads are handled in customizable pattern
  this.Upload.discriminator('image', imageSchema);

  this.router.use(uploadRoutes(this.config, this.Upload));

  this.router.use(collectionRoutes({
    model: this.Upload,
    config: this.config.upload,
  }));
}

module.exports = registerUpload;
