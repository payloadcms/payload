import Ajv from 'ajv';
import * as payloadSchema from './payload.schema.json';
import * as collectionSchema from './collection.schema.json';

import InvalidSchema from '../errors/InvalidSchema';

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

export default validateSchema;
