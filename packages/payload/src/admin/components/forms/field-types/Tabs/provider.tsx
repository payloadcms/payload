import React, { createContext, useContext } from 'react'

const Context = createContext(false)

export const TabsProvider: React.FC<{ children?: React.ReactNode; withinTab?: boolean }> = ({
  children,
  withinTab = true,
}) => {
  return <Context.Provider value={withinTab}>{children}</Context.Provider>
}

export const useTabs = (): boolean => useContext(Context)

export default Context
