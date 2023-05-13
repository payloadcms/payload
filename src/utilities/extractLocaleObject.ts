import { LocalizationConfig, LabeledLocale } from '../config/types';
/*
 return the LabeledLocale for given locale string, else return null
*/
export const extractLocaleObject = (
  localizationConfig: LocalizationConfig,
  locale: string,
): LabeledLocale | undefined => {
  if (!localizationConfig) return undefined;
  const { locales } = localizationConfig;
  const firstLocale = locales[0];
  if (typeof firstLocale === 'string') {
    return null;
  }
  const labeledLocales = locales as LabeledLocale[];
  return labeledLocales.find(
    (el) => el?.value === locale,
  );
};

export default extractLocaleObject;
