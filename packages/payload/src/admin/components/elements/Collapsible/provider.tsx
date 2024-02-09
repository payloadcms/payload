import React, { createContext, useContext } from 'react'

const Context = createContext(false)
const IsOpenContext = createContext(false)

export const CollapsibleProvider: React.FC<{
  children?: React.ReactNode
  collapsed?: boolean
  withinCollapsible?: boolean
}> = ({ children, collapsed, withinCollapsible = true }) => {
  return (
    <Context.Provider value={withinCollapsible}>
      <IsOpenContext.Provider value={Boolean(collapsed)}>{children}</IsOpenContext.Provider>
    </Context.Provider>
  )
}

export const useCollapsible = (): boolean => useContext(Context)
export const useCollapsibleIsOpen = (): boolean => useContext(IsOpenContext)
