'use client'

import React, { createContext, use } from 'react'

export type SidebarTabsContextType = {
  activeTabSlug: null | string
  /**
   * Reload the content for a specific tab, bypassing the cache.
   * Useful when the tab's data dependencies change.
   */
  reloadTabContent: (tabSlug: string) => void
}

const SidebarTabsContext = createContext<null | SidebarTabsContextType>(null)

export type SidebarTabsProviderProps = {
  activeTabSlug: null | string
  children: React.ReactNode
  reloadTabContent: (tabSlug: string) => void
}

export const SidebarTabsProvider: React.FC<SidebarTabsProviderProps> = ({
  activeTabSlug,
  children,
  reloadTabContent,
}) => {
  return (
    <SidebarTabsContext value={{ activeTabSlug, reloadTabContent }}>{children}</SidebarTabsContext>
  )
}

/**
 * Hook to access sidebar tab controls.
 * Returns null if used outside of a SidebarTabsProvider (e.g., when there's only one tab).
 */
export const useSidebarTabs = (): null | SidebarTabsContextType => {
  return use(SidebarTabsContext)
}
