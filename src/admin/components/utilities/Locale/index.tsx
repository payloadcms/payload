import React, {
  createContext, useContext, useState, useEffect,
} from 'react';
import { useConfig } from '@payloadcms/config-provider';
import { useSearchParams } from '../SearchParams';

const Context = createContext('');

export const LocaleProvider: React.FC = ({ children }) => {
  const { localization } = useConfig();
  const defaultLocale = (localization && localization.defaultLocale) ? localization.defaultLocale : 'en';
  const [locale, setLocale] = useState<string>(defaultLocale);
  const searchParams = useSearchParams();
  const localeFromParams = searchParams.locale;

  useEffect(() => {
    if (localeFromParams && localization.locales.indexOf(localeFromParams as string) > -1) setLocale(localeFromParams as string);
  }, [localeFromParams, localization]);

  return (
    <Context.Provider value={locale}>
      {children}
    </Context.Provider>
  );
};

export const useLocale = (): string => useContext(Context);

export default Context;
