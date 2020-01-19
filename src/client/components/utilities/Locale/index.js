import React, { createContext, useContext } from 'react';
import config from 'payload-config';
import PropTypes from 'prop-types';
import searchParamsContext from '../SearchParams';

const Context = createContext({});

export const LocaleProvider = ({ children }) => {
  const searchParams = useContext(searchParamsContext);

  let activeLocale = null;

  if (config.localization) {
    if (searchParams.locale && config.localization.locales.indexOf(searchParams.locale) > -1) {
      activeLocale = searchParams.locale;
    } else {
      activeLocale = (config.localization.defaultLocale);
    }
  }

  return (
    <Context.Provider value={activeLocale}>
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
