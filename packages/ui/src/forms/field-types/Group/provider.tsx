import React, { createContext, useContext } from 'react'

const Context = createContext(false)

export const GroupProvider: React.FC<{ children?: React.ReactNode; withinGroup?: boolean }> = ({
  children,
  withinGroup = true,
}) => {
  return <Context.Provider value={withinGroup}>{children}</Context.Provider>
}

export const useGroup = (): boolean => useContext(Context)

export default Context
