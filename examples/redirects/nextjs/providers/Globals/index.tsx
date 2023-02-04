import React, { createContext, useContext } from 'react';
import { MainMenu } from '../../payload-types';

export type MainMenuType = MainMenu

export interface IGlobals {
  mainMenu: MainMenuType,
}

export const GlobalsContext = createContext<IGlobals>({} as IGlobals);
export const useGlobals = (): IGlobals => useContext(GlobalsContext);

export const GlobalsProvider: React.FC<IGlobals & {
  children: React.ReactNode
}> = (props) => {
  const {
    mainMenu,
    children,
  } = props;

  return (
    <GlobalsContext.Provider
      value={{
        mainMenu,
      }}
    >
      {children}
    </GlobalsContext.Provider>
  );
};
