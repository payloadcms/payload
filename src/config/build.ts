import { Config } from './types';
import sanitize from './sanitize';
import validate from './validate';

/**
 * @description Builds and validates Payload configuration
 * @param config Payload Config
 * @returns Built and sanitized Payload Config
 */
export function buildConfig(config: Config): Config {
  const validated = validate(config);
  const sanitized = sanitize(validated);

  return sanitized;
}
