/*
 return the Locale for given locale code, else return null
*/export const findLocaleFromCode = (localizationConfig, locale) => {
  if (!localizationConfig?.locales || localizationConfig.locales.length === 0) {
    return null;
  }
  return localizationConfig.locales.find(el => el?.code === locale);
};
//# sourceMappingURL=findLocaleFromCode.js.map