import React, {
  createContext, useContext, useState, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import config from '../../../config/sanitizedClientConfig';
import { useSearchParams } from '../SearchParams';

const defaultLocale = (config.localization && config.localization.defaultLocale) ? config.localization.defaultLocale : 'en';
const Context = createContext({});

export const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState(defaultLocale);
  const searchParams = useSearchParams();
  const localeFromParams = searchParams.locale;

  useEffect(() => {
    if (localeFromParams && config.localization.locales.indexOf(localeFromParams) > -1) setLocale(localeFromParams);
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
