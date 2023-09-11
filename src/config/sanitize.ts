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

const sanitizeAdminConfig = (configToSanitize: Config): Partial<SanitizedConfig> => {
  const sanitizedConfig = { ...configToSanitize };

  // add default user collection if none provided
  if (!sanitizedConfig?.admin?.user) {
    const firstCollectionWithAuth = sanitizedConfig.collections.find(({ auth }) => Boolean(auth));
    if (firstCollectionWithAuth) {
      sanitizedConfig.admin.user = firstCollectionWithAuth.slug;
    } else {
      sanitizedConfig.admin.user = defaultUserCollection.slug;
      sanitizedConfig.collections.push(defaultUserCollection);
    }
  }

  if (!sanitizedConfig.collections.find(({ slug }) => slug === sanitizedConfig.admin.user)) {
    throw new InvalidConfiguration(`${sanitizedConfig.admin.user} is not a valid admin user collection`);
  }

  // add default bundler if none provided
  if (!sanitizedConfig.admin.bundler) {
    sanitizedConfig.admin.bundler = getDefaultBundler();
  }

  return sanitizedConfig as Partial<SanitizedConfig>;
};

export const sanitizeConfig = (incomingConfig: Config): SanitizedConfig => {
  const configWithDefaults: Config = merge(defaults, incomingConfig, {
    isMergeableObject: isPlainObject,
  });

  const config: Partial<SanitizedConfig> = sanitizeAdminConfig(configWithDefaults);
  config.collections = config.collections.map((collection) => sanitizeCollection(configWithDefaults, collection));

  checkDuplicateCollections(config.collections);

  if (config.globals.length > 0) {
    config.globals = sanitizeGlobals(config.collections, config.globals);
  }

  if (typeof config.serverURL === 'undefined') {
    config.serverURL = '';
  }

  if (config.serverURL !== '') {
    config.csrf.push(config.serverURL);
  }

  return config as SanitizedConfig;
};
