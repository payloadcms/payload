import React, { createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import qs from 'qs';

const Context = createContext({});

export const SearchParamsProvider = ({ children }) => {
  const location = useLocation();

  const params = qs.parse(
    location.search,
    { ignoreQueryPrefix: true },
  );

  return (
    <Context.Provider value={params}>
      {children}
    </Context.Provider>
  );
};

SearchParamsProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export const useSearchParams = () => useContext(Context);
