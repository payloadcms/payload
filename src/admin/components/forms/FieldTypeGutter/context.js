import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useWindowInfo } from '@faceless-ui/window-info';

const context = createContext(false);
const { Provider } = context;

export const NegativeFieldGutterProvider = ({ children, allow }) => {
  const { breakpoints: { m: midBreak } } = useWindowInfo();

  return (
    <Provider value={allow && !midBreak}>
      {children}
    </Provider>
  );
};

export const useNegativeFieldGutter = () => useContext(context);

NegativeFieldGutterProvider.defaultProps = {
  allow: false,
};

NegativeFieldGutterProvider.propTypes = {
  children: PropTypes.node.isRequired,
  allow: PropTypes.bool,
};
