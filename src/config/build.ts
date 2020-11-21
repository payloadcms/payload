import { PayloadConfig } from '../types';
import sanitize from './sanitize';
import validate from './validate';

const buildConfig = (config: PayloadConfig) => {
  const validated = validate(config);
  const sanitized = sanitize(validated);

  return sanitized;
};

module.exports = buildConfig;
