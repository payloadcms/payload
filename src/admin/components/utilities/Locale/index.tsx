import React, { createContext, useContext, useState, useEffect } from 'react';
import { LabeledLocale } from '../../../../config/types';
import { useConfig } from '../Config';
import { useAuth } from '../Auth';
import { usePreferences } from '../Preferences';
import { useSearchParams } from '../SearchParams';
import unifiedLocaleConfig from '../../../../utilities/unifiedLocaleConfig';
import extractLocaleObject from '../../../../utilities/extractLocaleObject';

const Context = createContext('');
const ExtendedContext = createContext(null);

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
  const [extendedLocale, setExtendedLocale] = useState<LabeledLocale | null>(
    localization && extractLocaleObject(localization, locale),
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
      setExtendedLocale(
        extractLocaleObject(localization, localeFromParams as string),
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
          setExtendedLocale(
            extractLocaleObject(localization, preferenceLocale as string),
          );
          return;
        }
        setPreference('locale', defaultLocale);
      }
      setLocale(defaultLocale);
      setExtendedLocale(extractLocaleObject(localization, defaultLocale));
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
    <Context.Provider value={locale}>
      <ExtendedContext.Provider value={extendedLocale}>
        {children}
      </ExtendedContext.Provider>
    </Context.Provider>
  );
};

export const useLocale = (): string => useContext(Context);
export const useExtendedLocale = (): LabeledLocale | null => useContext(ExtendedContext);
export default Context;
