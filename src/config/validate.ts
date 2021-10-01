import { ValidationResult } from 'joi';
import schema from './schema';
import collectionSchema from '../collections/config/schema';
import Logger from '../utilities/logger';
import { SanitizedConfig } from './types';
import { SanitizedCollectionConfig } from '../collections/config/types';
import fieldSchema, { idField } from '../fields/config/schema';
import { SanitizedGlobalConfig } from '../globals/config/types';
import globalSchema from '../globals/config/schema';

const logger = Logger();

const validateFields = (context: string, entity: SanitizedCollectionConfig | SanitizedGlobalConfig): string[] => {
  const errors: string[] = [];
  entity.fields.forEach((field) => {
    let idResult: Partial<ValidationResult> = { error: null };
    if (field.name === 'id') {
      idResult = idField.validate(field, { abortEarly: false });
    }

    const result = fieldSchema.validate(field, { abortEarly: false });
    if (idResult.error) {
      idResult.error.details.forEach(({ message }) => {
        errors.push(`${context} "${entity.slug}" > Field "${field.name}" > ${message}`);
      });
    }
    if (result.error) {
      result.error.details.forEach(({ message }) => {
        errors.push(`${context} "${entity.slug}" > Field "${field.name}" > ${message}`);
      });
    }
  });
  return errors;
};

const validateCollections = (collections: SanitizedCollectionConfig[]): string[] => {
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

const validateGlobals = (globals: SanitizedGlobalConfig[]): string[] => {
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

const validateSchema = (config: SanitizedConfig): SanitizedConfig => {
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


  return result.value;
};

export default validateSchema;
