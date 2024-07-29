import React, { createContext, useContext } from 'react'

type ContextType = {
  collapsed: boolean
  isVisible: boolean
  toggle: () => void
  withinCollapsible: boolean
}
const Context = createContext({
  collapsed: false,
  isVisible: true,
  toggle: () => {},
  withinCollapsible: false,
})

export const CollapsibleProvider: React.FC<{
  children?: React.ReactNode
  collapsed?: boolean
  toggle: () => void
  withinCollapsible?: boolean
}> = ({ children, collapsed, toggle, withinCollapsible = true }) => {
  const { collapsed: parentIsCollapsed, isVisible } = useCollapsible()

  const contextValue = React.useMemo((): ContextType => {
    return {
      collapsed: Boolean(collapsed),
      isVisible: isVisible && !parentIsCollapsed,
      toggle,
      withinCollapsible,
    }
  }, [collapsed, withinCollapsible, toggle, parentIsCollapsed, isVisible])
  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

export const useCollapsible = (): ContextType => useContext(Context)
