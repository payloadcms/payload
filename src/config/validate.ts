import { ValidationResult } from 'joi';
import { Logger } from 'pino';
import { pathToRegexp } from 'path-to-regexp';
import schema from './schema';
import collectionSchema from '../collections/config/schema';
import { Endpoint, SanitizedConfig } from './types';
import { SanitizedCollectionConfig } from '../collections/config/types';
import fieldSchema, { idField } from '../fields/config/schema';
import { SanitizedGlobalConfig } from '../globals/config/types';
import globalSchema from '../globals/config/schema';
import { fieldAffectsData } from '../fields/config/types';
import { collectionEndpointDefaults } from '../collections/config/defaults';
import { globalEndpointDefaults } from '../globals/config/defaults';

const validateFields = (context: string, entity: SanitizedCollectionConfig | SanitizedGlobalConfig): string[] => {
  const errors: string[] = [];
  entity.fields.forEach((field) => {
    let idResult: Partial<ValidationResult> = { error: null };
    if (fieldAffectsData(field) && field.name === 'id') {
      idResult = idField.validate(field, { abortEarly: false });
    }

    const result = fieldSchema.validate(field, { abortEarly: false });
    if (idResult.error) {
      idResult.error.details.forEach(({ message }) => {
        errors.push(`${context} "${entity.slug}" > Field${fieldAffectsData(field) ? ` "${field.name}" >` : ''} ${message}`);
      });
    }
    if (result.error) {
      result.error.details.forEach(({ message }) => {
        errors.push(`${context} "${entity.slug}" > Field${fieldAffectsData(field) ? ` "${field.name}" >` : ''} ${message}`);
      });
    }
  });
  return errors;
};

const validateEndpoints = (context: string, entity: SanitizedCollectionConfig | SanitizedGlobalConfig, defaultEndpoints: Omit<Endpoint, 'handlers'>[]): string[] => {
  const errors: string[] = [];
  const { endpoints } = entity;
  const endpointsToTest = [...endpoints, ...defaultEndpoints];
  endpoints.forEach((endpoint, endpointIndex) => {
    endpointsToTest.slice(endpointIndex + 1).forEach((endpointToTest) => {
      if (endpoint.method !== endpointToTest.method) {
        return true;
      }

      const regex = pathToRegexp(endpoint.route);
      if (endpointToTest.route.match(regex)) {
        errors.push(`${context} "${entity.slug}" > endpoint "${endpoint.method}: ${endpoint.route}" conflicts with endpoint "${endpointToTest.method}: ${endpointToTest.route}"`);
      }

      return true;
    });
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
    errors.push(...validateEndpoints('Collection', collection, [
      ...(collection.auth ? [
        ...collectionEndpointDefaults.auth,
        ...(collection.auth.verify ? collectionEndpointDefaults.verify : []),
        ...(collection.auth.maxLoginAttempts ? collectionEndpointDefaults.unlock : []),
      ] : []),
      ...collectionEndpointDefaults.crud,
    ]));
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
    errors.push(...validateEndpoints('Global', global, [
      ...(global.versions ? globalEndpointDefaults.versions : []),
      ...globalEndpointDefaults.crud,
    ]));
  });

  return errors;
};

const validateSchema = (config: SanitizedConfig, logger: Logger): SanitizedConfig => {
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
