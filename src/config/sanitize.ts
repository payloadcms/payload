import merge from 'deepmerge';
import { isPlainObject } from 'is-plain-object';
import { Config, SanitizedConfig } from './types';
import { defaultUserCollection } from '../auth/defaultUser';
import sanitizeCollection from '../collections/config/sanitize';
import { InvalidConfiguration } from '../errors';
import sanitizeGlobals from '../globals/config/sanitize';
import checkDuplicateCollections from '../utilities/checkDuplicateCollections';
import { defaults } from './defaults';
import getDefaultBundler from '../bundlers/webpack/bundler';

const sanitizeAdmin = (config: SanitizedConfig): SanitizedConfig['admin'] => {
  const adminConfig = config.admin;

  // add default user collection if none provided
  if (!adminConfig?.user) {
    const firstCollectionWithAuth = config.collections.find(({ auth }) => Boolean(auth));
    if (firstCollectionWithAuth) {
      adminConfig.user = firstCollectionWithAuth.slug;
    } else {
      adminConfig.user = 'users';
      const sanitizedDefaultUser = sanitizeCollection(config, defaultUserCollection);
      config.collections.push(sanitizedDefaultUser);
    }
  }

  if (!config.collections.find(({ slug }) => slug === adminConfig.user)) {
    throw new InvalidConfiguration(`${config.admin.user} is not a valid admin user collection`);
  }

  // add default bundler if none provided
  if (!adminConfig.bundler) {
    adminConfig.bundler = getDefaultBundler();
  }

  return adminConfig;
};

export const sanitizeConfig = (config: Config): SanitizedConfig => {
  const sanitizedConfig: Config = merge(defaults, config, {
    isMergeableObject: isPlainObject,
  }) as Config;

  sanitizedConfig.admin = sanitizeAdmin(sanitizedConfig as SanitizedConfig);

  sanitizedConfig.collections = sanitizedConfig.collections.map((collection) => sanitizeCollection(sanitizedConfig, collection));
  checkDuplicateCollections(sanitizedConfig.collections);

  if (sanitizedConfig.globals.length > 0) {
    sanitizedConfig.globals = sanitizeGlobals(sanitizedConfig.collections, sanitizedConfig.globals);
  }

  if (typeof sanitizedConfig.serverURL === 'undefined') {
    sanitizedConfig.serverURL = '';
  }

  if (sanitizedConfig.serverURL !== '') {
    sanitizedConfig.csrf.push(sanitizedConfig.serverURL);
  }

  return sanitizedConfig as SanitizedConfig;
};
