const Ajv = require('Ajv');
const payloadSchema = require('./payload.schema.json');
const collectionSchema = require('./collection.schema.json');
const InvalidSchema = require('../errors/InvalidSchema');

const validateSchema = (config) => {
  const ajv = new Ajv({ useDefaults: true });
  const validate = ajv.addSchema(collectionSchema, '/collection.schema.json')
    .compile(payloadSchema);
  const valid = validate(config);
  if (!valid) {
    throw new InvalidSchema(`Invalid payload config provided. Found ${validate.errors.length} errors`, validate.errors);
  }

  return config;
};

module.exports = validateSchema;
