import React, { createContext, useContext } from 'react'

type ContextType = {
  collapsed: boolean
  withinCollapsible: boolean
}
const Context = createContext({
  collapsed: false,
  withinCollapsible: true,
})

export const CollapsibleProvider: React.FC<{
  children?: React.ReactNode
  collapsed?: boolean
  withinCollapsible?: boolean
}> = ({ children, collapsed, withinCollapsible = true }) => {
  return (
    <Context.Provider
      value={{
        collapsed: Boolean(collapsed),
        withinCollapsible,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useCollapsible = (): ContextType => useContext(Context)

export default Context
