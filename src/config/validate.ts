import schema from './schema';
import collectionSchema from '../collections/config/schema';
import Logger from '../utilities/logger';
import { PayloadConfig, Config } from './types';
import { PayloadCollectionConfig } from '../collections/config/types';
import fieldSchema from '../fields/config/schema';
import { PayloadGlobalConfig } from '../globals/config/types';
import globalSchema from '../globals/config/schema';

const logger = Logger();

const validateFields = (context: string, collection: PayloadCollectionConfig): string[] => {
  const errors: string[] = [];
  collection.fields.forEach((field) => {
    const result = fieldSchema.validate(field, { abortEarly: false });
    if (result.error) {
      result.error.details.forEach(({ message }) => {
        errors.push(`${context} "${collection.slug}" > Field "${field.name}" > ${message}`);
      });
    }
  });
  return errors;
};

const validateCollections = (collections: PayloadCollectionConfig[]): string[] => {
  const errors: string[] = [];
  collections.forEach((collection) => {
    const result = collectionSchema.validate(collection, { abortEarly: false });
    if (result.error) {
      result.error.details.forEach(({ message }) => {
        errors.push(`Collection "${collection.slug}" > ${message}`);
      });
    }
    errors.push(...validateFields('Collection', collection));
  });

  return errors;
};

const validateGlobals = (globals: PayloadGlobalConfig[]): string[] => {
  const errors: string[] = [];
  globals.forEach((global) => {
    const result = globalSchema.validate(global, { abortEarly: false });
    if (result.error) {
      result.error.details.forEach(({ message }) => {
        errors.push(`Globals "${global.slug}" > ${message}`);
      });
    }
    errors.push(...validateFields('Global', global));
  });

  return errors;
};

const validateSchema = (config: PayloadConfig): Config => {
  const result = schema.validate(config, {
    abortEarly: false,
  });

  const nestedErrors = [
    ...validateCollections(config.collections),
    ...validateGlobals(config.globals),
  ];

  if (result.error || nestedErrors.length > 0) {
    logger.error(`There were ${(result.error?.details?.length || 0) + nestedErrors.length} errors validating your Payload config`);

    let i = 0;
    if (result.error) {
      result.error.details.forEach(({ message }) => {
        i += 1;
        logger.error(`${i}: ${message}`);
      });
    }
    nestedErrors.forEach((message) => {
      i += 1;
      logger.error(`${i}: ${message}`);
    });

    process.exit(1);
  }


  return result.value as Config;
};

export default validateSchema;
