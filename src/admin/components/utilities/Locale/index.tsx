import React, { createContext, useContext, useState, useEffect } from 'react';
import { LabeledLocale } from '../../../../config/types';
import { useConfig } from '../Config';
import { useAuth } from '../Auth';
import { usePreferences } from '../Preferences';
import { useSearchParams } from '../SearchParams';
import unifiedLocaleConfig from '../../../../utilities/unifiedLocaleConfig';
import extractLabeledLocale from '../../../../utilities/extractLabeledLocale';

const LocaleContext = createContext('');
const LabeledLocaleContext = createContext(null);

export const LocaleProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { localization } = useConfig();
  // localization but extracts locales into string[] when an object is provided
  const unifiedLocalization = localization ? unifiedLocaleConfig(localization) : undefined;
  const { user } = useAuth();
  const defaultLocale = (localization && localization.defaultLocale)
    ? localization.defaultLocale
    : 'en';
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<string>(
    (searchParams?.locale as string) || defaultLocale,
  );
  const [labeledLocale, setLabeledLocale] = useState<LabeledLocale | null>(
    localization && extractLabeledLocale(localization, locale),
  );
  const { getPreference, setPreference } = usePreferences();
  const localeFromParams = searchParams.locale;

  useEffect(() => {
    if (!localization) {
      return;
    }

    // set locale from search param
    if (
      localeFromParams
      && unifiedLocalization.locales.indexOf(localeFromParams as string) > -1
    ) {
      setLocale(localeFromParams as string);
      setLabeledLocale(
        extractLabeledLocale(localization, localeFromParams as string),
      );
      if (user) setPreference('locale', localeFromParams);
      return;
    }

    // set locale from preferences or default
    (async () => {
      let preferenceLocale: string;
      let isPreferenceInConfig: boolean;
      if (user) {
        preferenceLocale = await getPreference<string>('locale');
        isPreferenceInConfig = preferenceLocale
          && unifiedLocalization.locales.indexOf(preferenceLocale) > -1;
        if (isPreferenceInConfig) {
          setLocale(preferenceLocale);
          setLabeledLocale(
            extractLabeledLocale(localization, preferenceLocale as string),
          );
          return;
        }
        setPreference('locale', defaultLocale);
      }
      setLocale(defaultLocale);
      setLabeledLocale(extractLabeledLocale(localization, defaultLocale));
    })();
  }, [
    defaultLocale,
    getPreference,
    localeFromParams,
    unifiedLocalization,
    setPreference,
    user,
    localization,
  ]);

  return (
    <LocaleContext.Provider value={locale}>
      <LabeledLocaleContext.Provider value={labeledLocale}>
        {children}
      </LabeledLocaleContext.Provider>
    </LocaleContext.Provider>
  );
};

export const useLocale = (): string => useContext(LocaleContext);

/**
 * A hook that returns the current labeled locale. If the current locale is a normal locale and not a labeled one, this will return null.
 */
export const useLabeledLocale = (): LabeledLocale | null => useContext(LabeledLocaleContext);
export default LocaleContext;
