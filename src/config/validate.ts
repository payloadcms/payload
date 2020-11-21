import Ajv from 'ajv';
import * as configSchema from './schema.json';
import * as collectionSchema from '../collections/config/schema.json';

import InvalidSchema from '../errors/InvalidSchema';
import { PayloadConfig } from './types';

const validateSchema = (config: PayloadConfig): PayloadConfig => {
  const ajv = new Ajv({ useDefaults: true });
  const validate = ajv.addSchema(collectionSchema, '../collections/config/schema.json').compile(configSchema);
  const valid = validate(config);

  if (!valid) {
    throw new InvalidSchema(`Invalid payload config provided. Found ${validate.errors.length} errors`, validate.errors);
  }

  return config;
};

export default validateSchema;
