import merge from 'deepmerge';
import { isPlainObject } from 'is-plain-object';
import type { Config, LocalizationConfigWithNoLabels, SanitizedConfig, SanitizedLocalizationConfig } from './types';
import defaultUser from '../auth/defaultUser';
import sanitizeCollection from '../collections/config/sanitize';
import { InvalidConfiguration } from '../errors';
import sanitizeGlobals from '../globals/config/sanitize';
import checkDuplicateCollections from '../utilities/checkDuplicateCollections';
import { defaults } from './defaults';

const sanitizeConfig = (config: Config): SanitizedConfig => {
  const sanitizedConfig = merge(defaults, config, {
    isMergeableObject: isPlainObject,
  }) as Config;

  if (!sanitizedConfig.admin.user) {
    const firstCollectionWithAuth = sanitizedConfig.collections.find((c) => c.auth);
    if (firstCollectionWithAuth) {
      sanitizedConfig.admin.user = firstCollectionWithAuth.slug;
    } else {
      sanitizedConfig.admin.user = 'users';
      const sanitizedDefaultUser = sanitizeCollection(sanitizedConfig, defaultUser);
      sanitizedConfig.collections.push(sanitizedDefaultUser);
    }
  } else if (!sanitizedConfig.collections.find((c) => c.slug === sanitizedConfig.admin.user)) {
    throw new InvalidConfiguration(`${sanitizedConfig.admin.user} is not a valid admin user collection`);
  }

  if (sanitizedConfig.localization && sanitizedConfig.localization.locales?.length > 0) {
    // clone localization config so to not break everything
    const firstLocale = sanitizedConfig.localization.locales[0];
    if (typeof firstLocale === 'string') {
      (sanitizedConfig.localization as SanitizedLocalizationConfig).localesSimple = [...(sanitizedConfig.localization as LocalizationConfigWithNoLabels).locales];

      // is string[], so convert to LabeledLocale[]
      (sanitizedConfig.localization as SanitizedLocalizationConfig).locales = (sanitizedConfig.localization as LocalizationConfigWithNoLabels).locales.map((locale) => ({
        label: locale,
        value: locale,
        rtl: false,
        toString: () => locale,
      }));
    } else {
      // is LabeledLocale[], so convert to string[] for localesSimple
      (sanitizedConfig.localization as SanitizedLocalizationConfig).localesSimple = (sanitizedConfig.localization as SanitizedLocalizationConfig).locales.reduce((locales, locale) => {
        locales.push(locale.value);
        return locales;
      }, [] as string[]);
    }
  }

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

export default sanitizeConfig;
