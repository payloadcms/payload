import type { SanitizedLocalizationConfig, LabeledLocale } from '../config/types';
/*
 return the LabeledLocale for given locale string, else return null
*/
export const extractLabeledLocale = (
  localizationConfig: SanitizedLocalizationConfig,
  locale: string,
): LabeledLocale | null => {
  if (!localizationConfig?.locales || localizationConfig.locales.length === 0) {
    return null;
  }

  return localizationConfig.locales.find(
    (el) => el?.code === locale,
  );
};

export default extractLabeledLocale;
