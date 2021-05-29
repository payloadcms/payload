import React, {
  createContext, useContext, useState, useEffect,
} from 'react';
import { useAuth, useConfig } from '@payloadcms/config-provider';
import { usePreferences } from '../Preferences';
import { useSearchParams } from '../SearchParams';

const Context = createContext('');

export const LocaleProvider: React.FC = ({ children }) => {
  const { localization } = useConfig();
  const { user } = useAuth();
  const defaultLocale = (localization && localization.defaultLocale) ? localization.defaultLocale : 'en';
  const [locale, setLocale] = useState<string>(defaultLocale);
  const { getPreference, setPreference } = usePreferences();
  const searchParams = useSearchParams();
  const localeFromParams = searchParams.locale;

  useEffect(() => {
    if (!localization) {
      return;
    }

    // set locale from search param
    if (localeFromParams && localization.locales.indexOf(localeFromParams as string) > -1) {
      setLocale(localeFromParams as string);
      if (user) setPreference('locale', localeFromParams);
      return;
    }

    // set locale from preferences or default
    (async () => {
      let preferenceLocale: string;
      let isPreferenceInConfig: boolean;
      if (user) {
        preferenceLocale = await getPreference<string>('locale');
        isPreferenceInConfig = preferenceLocale && (localization.locales.indexOf(preferenceLocale) > -1);
        if (isPreferenceInConfig) {
          setLocale(preferenceLocale);
          return;
        }
        setPreference('locale', defaultLocale);
      }
      setLocale(defaultLocale);
    })();
  }, [defaultLocale, getPreference, localeFromParams, localization, setPreference, user]);

  return (
    <Context.Provider value={locale}>
      {children}
    </Context.Provider>
  );
};

export const useLocale = (): string => useContext(Context);

export default Context;
