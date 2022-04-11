import React, { createContext, useContext } from 'react';
import { useWindowInfo } from '@faceless-ui/window-info';

const context = createContext(false);
const { Provider } = context;

export const NegativeFieldGutterProvider: React.FC<{allow?: boolean, children?: React.ReactNode}> = ({ children, allow }) => {
  const { breakpoints: { m: midBreak } } = useWindowInfo();

  return (
    <Provider value={allow && !midBreak}>
      {children}
    </Provider>
  );
};

export const useNegativeFieldGutter = (): boolean => useContext(context);
