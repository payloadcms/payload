import { Config } from './types';
import sanitize from './sanitize';
import validate from './validate';

export function buildConfig(config: Config): Config {
  const validated = validate(config);
  const sanitized = sanitize(validated);

  return sanitized;
}
