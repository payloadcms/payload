import React, { createContext, useContext } from 'react';
import { SanitizedConfig } from '../../../../config/types';

const Context = createContext<SanitizedConfig>({} as SanitizedConfig);

export const ConfigProvider: React.FC<{config: SanitizedConfig, children: React.ReactNode}> = ({ children, config }) => (
  <Context.Provider value={config}>
    {children}
  </Context.Provider>
);

export const useConfig = (): SanitizedConfig => useContext(Context);
