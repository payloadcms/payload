import type { SanitizedLocalizationConfig, LabeledLocale } from '../config/types';
/*
 return the LabeledLocale for given locale string, else return null
*/
export const extractLabeledLocale = (
  localizationConfig: SanitizedLocalizationConfig,
  locale: string,
): LabeledLocale | undefined => {
  if (!localizationConfig?.locales || localizationConfig.locales.length === 0) {
    return undefined;
  }

  return localizationConfig.locales.find(
    (el) => el?.value === locale,
  );
};

export default extractLabeledLocale;
