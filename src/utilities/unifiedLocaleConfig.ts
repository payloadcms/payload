import {
  LocalizationConfig,
  LabeledLocale,
  LocalizationConfigWithNoLabels,
} from '../config/types';

const localeToString = (locale: LabeledLocale | string) => {
  if (typeof locale === 'string') {
    return locale;
  }
  return locale.value;
};
/*
 returns a clone of the LocalizationConfig where object locales are removed
 while preserving the original LocalizationConfig
*/
export const unifiedLocaleConfig = (
  localizationConfig: LocalizationConfig,
): LocalizationConfigWithNoLabels => {
  if (!localizationConfig?.locales || localizationConfig.locales.length === 0) {
    return localizationConfig as LocalizationConfigWithNoLabels;
  }
  // clone localization config so to not break everything
  const clonedLocalizationConfig = JSON.parse(JSON.stringify(localizationConfig));
  let { locales } = clonedLocalizationConfig;
  const firstLocale = locales[0];
  if (typeof firstLocale === 'string') {
    // is string[], so follows the old format
    return clonedLocalizationConfig as LocalizationConfigWithNoLabels;
  }
  // is LocalizationConfigWithLabels
  locales = locales.reduce(
    (values, locale) => [...values, localeToString(locale)],
    [],
  );
  clonedLocalizationConfig.locales = locales;
  return clonedLocalizationConfig as LocalizationConfigWithNoLabels;
};

export default unifiedLocaleConfig;
