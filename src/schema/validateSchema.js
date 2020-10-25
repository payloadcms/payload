const { Validator } = require('jsonschema');
const payloadSchema = require('./payload.schema.json');
const collectionSchema = require('./collection.schema.json');
const InvalidSchema = require('../errors/InvalidSchema');

const validateSchema = (config) => {
  const validator = new Validator();
  const validation = validator.validate(config, payloadSchema);
  if (validation.errors.length > 0) {
    throw new InvalidSchema(`Invalid payload config provided. Found ${validation.errors.length} errors`, validation.errors);
  }

  // TODO: include collectionSchema in validation
  // does validation set default values?
};

module.exports = validateSchema;
