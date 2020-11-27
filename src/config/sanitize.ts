import { Config } from './types';
import defaultUser from '../auth/defaultUser';
import sanitizeCollection from '../collections/config/sanitize';
import { InvalidConfiguration } from '../errors';
import sanitizeGlobals from '../globals/config/sanitize';
import checkDuplicateCollections from '../utilities/checkDuplicateCollections';

const sanitizeConfig = (config: Config): Config => {
  const sanitizedConfig = { ...config };

  sanitizedConfig.csrf.push(config.serverURL);

  sanitizedConfig.collections = sanitizedConfig.collections.map((collection) => sanitizeCollection(sanitizedConfig.collections, collection));
  checkDuplicateCollections(sanitizedConfig.collections);

  if (sanitizedConfig.globals) {
    sanitizedConfig.globals = sanitizeGlobals(sanitizedConfig.collections, sanitizedConfig.globals);
  } else {
    sanitizedConfig.globals = [];
  }

  if (!sanitizedConfig.admin.user) {
    sanitizedConfig.admin.user = 'users';
    sanitizedConfig.collections.push(sanitizeCollection(sanitizedConfig.collections, defaultUser));
  } else if (!sanitizedConfig.collections.find((c) => c.slug === sanitizedConfig.admin.user)) {
    throw new InvalidConfiguration(`${sanitizedConfig.admin.user} is not a valid admin user collection`);
  }

  return sanitizedConfig;
};

export default sanitizeConfig;
