'use client'
import React, { createContext, use } from 'react'

type ContextType = {
  isCollapsed: boolean
  isVisible: boolean
  isWithinCollapsible: boolean
  toggle: () => void
}

const Context = createContext({
  isCollapsed: undefined,
  isVisible: undefined,
  isWithinCollapsible: undefined,
  toggle: () => {},
} as ContextType)

export const CollapsibleProvider: React.FC<{
  children?: React.ReactNode
  isCollapsed?: boolean
  isWithinCollapsible?: boolean
  toggle: () => void
}> = ({ children, isCollapsed, isWithinCollapsible = true, toggle }) => {
  const { isCollapsed: parentIsCollapsed, isVisible } = useCollapsible()

  const contextValue = React.useMemo((): ContextType => {
    return {
      isCollapsed,
      isVisible: isVisible && !parentIsCollapsed,
      isWithinCollapsible,
      toggle,
    }
  }, [isCollapsed, isWithinCollapsible, toggle, parentIsCollapsed, isVisible])

  return <Context value={contextValue}>{children}</Context>
}

export const useCollapsible = (): ContextType => use(Context)
