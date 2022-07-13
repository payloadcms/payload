import React, {
  createContext, useContext,
} from 'react';

const Context = createContext(false);

export const CollapsibleProvider: React.FC<{ children?: React.ReactNode, withinCollapsible: boolean }> = ({ children, withinCollapsible }) => {
  return (
    <Context.Provider value={withinCollapsible}>
      {children}
    </Context.Provider>
  );
};

export const useCollapsible = (): boolean => useContext(Context);

export default Context;
