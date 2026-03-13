'use client'

import React, { createContext, use } from 'react'

export type SidebarTabsContextType = {
  /**
   * Reload the content for a specific tab, bypassing the cache.
   * Useful when the tab's data dependencies change.
   */
  reloadTabContent: (tabSlug: string) => void
}

const SidebarTabsContext = createContext<null | SidebarTabsContextType>(null)

export type SidebarTabsProviderProps = {
  children: React.ReactNode
  reloadTabContent: (tabSlug: string) => void
}

export const SidebarTabsProvider: React.FC<SidebarTabsProviderProps> = ({
  children,
  reloadTabContent,
}) => {
  return <SidebarTabsContext value={{ reloadTabContent }}>{children}</SidebarTabsContext>
}

/**
 * Hook to access sidebar tab controls.
 * Returns null if used outside of a SidebarTabsProvider (e.g., when there's only one tab).
 */
export const useSidebarTabs = (): null | SidebarTabsContextType => {
  return use(SidebarTabsContext)
}
