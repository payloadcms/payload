import React, {
  createContext, useContext, useState, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import config from 'payload/config';
import { useSearchParams } from '../SearchParams';

const { localization } = config;

const defaultLocale = (localization && localization.defaultLocale) ? localization.defaultLocale : 'en';
const Context = createContext({});

export const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState(defaultLocale);
  const searchParams = useSearchParams();
  const localeFromParams = searchParams.locale;

  useEffect(() => {
    if (localeFromParams && localization.locales.indexOf(localeFromParams) > -1) setLocale(localeFromParams);
  }, [localeFromParams]);

  return (
    <Context.Provider value={locale}>
      {children}
    </Context.Provider>
  );
};

export const useLocale = () => useContext(Context);

LocaleProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default Context;
