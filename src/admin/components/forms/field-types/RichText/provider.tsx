import React, {
  createContext, useContext,
} from 'react';

const Context = createContext(false);

export const RichTextProvider: React.FC<{ children?: React.ReactNode, withinRichText?: boolean }> = ({ children, withinRichText = true }) => {
  return (
    <Context.Provider value={withinRichText}>
      {children}
    </Context.Provider>
  );
};

export const useWithinRichText = (): boolean => useContext(Context);

export default Context;
