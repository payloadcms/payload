import merge from 'deepmerge';
import { Config, SanitizedConfig } from './types';
import defaultUser from '../auth/defaultUser';
import sanitizeCollection from '../collections/config/sanitize';
import { InvalidConfiguration } from '../errors';
import sanitizeGlobals from '../globals/config/sanitize';
import checkDuplicateCollections from '../utilities/checkDuplicateCollections';
import { defaults } from './defaults';

const sanitizeConfig = (config: Config): SanitizedConfig => {
  const sanitizedConfig = merge(defaults, config) as Config;

  if (!sanitizedConfig.admin.user) {
    sanitizedConfig.admin.user = 'users';
    const sanitizedDefaultUser = sanitizeCollection(sanitizedConfig, defaultUser);
    sanitizedConfig.collections.push(sanitizedDefaultUser);
  } else if (!sanitizedConfig.collections.find((c) => c.slug === sanitizedConfig.admin.user)) {
    throw new InvalidConfiguration(`${sanitizedConfig.admin.user} is not a valid admin user collection`);
  }

  sanitizedConfig.collections = sanitizedConfig.collections.map((collection) => sanitizeCollection(sanitizedConfig, collection));
  checkDuplicateCollections(sanitizedConfig.collections);

  if (sanitizedConfig.globals.length > 0) {
    sanitizedConfig.globals = sanitizeGlobals(sanitizedConfig.collections, sanitizedConfig.globals);
  }

  if (sanitizedConfig.serverURL !== '') {
    sanitizedConfig.csrf.push(sanitizedConfig.serverURL);
  }

  return sanitizedConfig as SanitizedConfig;
};

export default sanitizeConfig;
