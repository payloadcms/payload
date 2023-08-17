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
import { SanitizedCollectionConfig } from '../collections/config/types';

const sanitizeAdminConfig = (config: Config): { adminCollection?: SanitizedCollectionConfig, adminConfig: SanitizedConfig['admin'] } => {
  const results = {
    adminCollection: null,
    adminConfig: { ...config.admin as SanitizedConfig['admin'] },
  };

  // add default user collection if none provided
  if (!results?.adminConfig?.user) {
    const firstCollectionWithAuth = config.collections.find(({ auth }) => Boolean(auth));
    if (firstCollectionWithAuth) {
      results.adminConfig.user = firstCollectionWithAuth.slug;
    } else {
      results.adminConfig.user = 'users';
      const sanitizedDefaultUser = sanitizeCollection(config, defaultUserCollection);
      results.adminCollection = sanitizedDefaultUser;
    }
  }

  if (!config.collections.find(({ slug }) => slug === results.adminConfig.user)) {
    throw new InvalidConfiguration(`${config.admin.user} is not a valid admin user collection`);
  }

  // add default bundler if none provided
  if (!results.adminConfig.bundler) {
    results.adminConfig.bundler = getDefaultBundler();
  }

  return results;
};

export const sanitizeConfig = (config: Config): SanitizedConfig => {
  const configWithDefaults: Partial<Config> = merge(defaults, config, {
    isMergeableObject: isPlainObject,
  });

  const { adminCollection, adminConfig } = sanitizeAdminConfig(configWithDefaults as Config);
  const sanitizedCollections = configWithDefaults.collections.map((collection) => sanitizeCollection(configWithDefaults, collection));
  const allCollections = [adminCollection, ...sanitizedCollections].filter(Boolean);
  checkDuplicateCollections(allCollections);

  const sanitizedConfig: Partial<SanitizedConfig> = {
    ...configWithDefaults as Partial<SanitizedConfig>,
    admin: adminConfig,
    collections: allCollections,
  };

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
