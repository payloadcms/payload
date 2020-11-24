import { PayloadConfig, Config } from './types';
import sanitize from './sanitize';
import validate from './validate';

export function buildConfig(config: PayloadConfig): Config {
  const validatedConfig = validate(config);
  const sanitizedConfig = sanitize(validatedConfig);
  return sanitizedConfig;
}
