import React, {
  createContext, useContext, useState, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { useConfig } from '../../providers/Config';
import { useSearchParams } from '../SearchParams';

const Context = createContext({});

export const LocaleProvider = ({ children }) => {
  const { localization } = useConfig();
  const defaultLocale = (localization && localization.defaultLocale) ? localization.defaultLocale : 'en';
  const [locale, setLocale] = useState(defaultLocale);
  const searchParams = useSearchParams();
  const localeFromParams = searchParams.locale;

  useEffect(() => {
    if (localeFromParams && localization.locales.indexOf(localeFromParams) > -1) setLocale(localeFromParams);
  }, [localeFromParams, localization]);

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
