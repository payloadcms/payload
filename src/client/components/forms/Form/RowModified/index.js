import React, {
  createContext, useContext,
} from 'react';
import PropTypes from 'prop-types';

const Context = createContext({});

export const RowModifiedProvider = ({ children, lastModified }) => {
  return (
    <Context.Provider value={lastModified}>
      {children}
    </Context.Provider>
  );
};

export const useRowModified = () => useContext(Context);

RowModifiedProvider.defaultProps = {
  lastModified: null,
};

RowModifiedProvider.propTypes = {
  children: PropTypes.node.isRequired,
  lastModified: PropTypes.number,
};

export default Context;
