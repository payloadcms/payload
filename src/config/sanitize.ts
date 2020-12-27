import merge from 'deepmerge';
import { PayloadConfig, Config } from './types';
import defaultUser from '../auth/defaultUser';
import sanitizeCollection from '../collections/config/sanitize';
import { InvalidConfiguration } from '../errors';
import sanitizeGlobals from '../globals/config/sanitize';
import checkDuplicateCollections from '../utilities/checkDuplicateCollections';
import { defaults } from './defaults';

const sanitizeConfig = (config: PayloadConfig): Config => {
  const sanitizedConfig = merge(defaults, config) as PayloadConfig;

  sanitizedConfig.collections = sanitizedConfig.collections.map((collection) => sanitizeCollection(sanitizedConfig.collections, collection));
  checkDuplicateCollections(sanitizedConfig.collections);

  if (sanitizedConfig.globals.length > 0) {
    sanitizedConfig.globals = sanitizeGlobals(sanitizedConfig.collections, sanitizedConfig.globals);
  }

  sanitizedConfig.csrf = [
    ...sanitizedConfig.csrf,
    config.serverURL,
  ];

  if (!sanitizedConfig.admin.user) {
    sanitizedConfig.admin.user = 'users';
    sanitizedConfig.collections.push(sanitizeCollection(sanitizedConfig.collections, defaultUser));
  } else if (!sanitizedConfig.collections.find((c) => c.slug === sanitizedConfig.admin.user)) {
    throw new InvalidConfiguration(`${sanitizedConfig.admin.user} is not a valid admin user collection`);
  }

  return sanitizedConfig as Config;
};

export default sanitizeConfig;
