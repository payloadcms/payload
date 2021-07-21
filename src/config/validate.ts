import schema from './schema';
import collectionSchema from '../collections/config/schema';
import Logger from '../utilities/logger';
import { PayloadConfig, Config } from './types';
import { PayloadCollectionConfig } from '../collections/config/types';

const logger = Logger();

const validateCollection = (collections: PayloadCollectionConfig[]): string[] => {
  const collectionResults = {};
  collections.forEach((collection) => {
    collectionResults[collection.slug] = collectionSchema.validate(collection, { abortEarly: false });
  });

  const collectionErrors: string[] = [];
  Object.keys(collectionResults).forEach((slug) => {
    if (collectionResults[slug].error) {
      collectionResults[slug].error.details.forEach(({ message }) => {
        collectionErrors.push(`Collection "${slug}" > ${message}`);
      });
    }
  });
  return collectionErrors;
};

const validateSchema = (config: PayloadConfig): Config => {
  const result = schema.validate(config, {
    abortEarly: false,
  });

  const collectionErrors = validateCollection(config.collections);

  if (result.error || collectionErrors.length > 0) {
    logger.error(`There were ${(result.error?.details?.length || 0) + collectionErrors.length} errors validating your Payload config`);

    let i = 0;
    if (result.error) {
      result.error.details.forEach(({ message }) => {
        i += 1;
        logger.error(`${i}: ${message}`);
      });
    }
    collectionErrors.forEach((message) => {
      i += 1;
      logger.error(`${i}: ${message}`);
    });

    process.exit(1);
  }


  return result.value as Config;
};

export default validateSchema;
