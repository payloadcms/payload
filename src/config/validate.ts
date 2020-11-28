import schema from './schema';
import Logger from '../utilities/logger';
import { PayloadConfig, Config } from './types';

const logger = Logger();

const validateSchema = (config: PayloadConfig): Config => {
  const result = schema.validate(config, {
    abortEarly: false,
  });

  if (result.error) {
    logger.error(`There were ${result.error.details.length} errors validating your Payload config`);

    result.error.details.forEach(({ message }, i) => {
      logger.error(`${i + 1}: ${message}`);
    });

    process.exit(1);
  }

  return result.value as Config;
};

export default validateSchema;
