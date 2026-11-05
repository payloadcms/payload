'use client'

import React, { createContext, use } from 'react'

import type { RenderTabServerFnArgs } from '../../elements/Nav/SidebarTabs/renderTabServerFn.js'

export type SidebarTabsContextType = {
  activeTabSlug: null | string
  /**
   * Reload the content for a specific tab, bypassing the cache.
   * Useful when the tab's data dependencies change.
   */
  reloadTabContent: (tabSlug: string, serverArgs?: Partial<RenderTabServerFnArgs>) => void
}

const SidebarTabsContext = createContext<null | SidebarTabsContextType>(null)

export type SidebarTabsProviderProps = {
  activeTabSlug: null | string
  children: React.ReactNode
  reloadTabContent: (tabSlug: string, serverArgs?: Partial<RenderTabServerFnArgs>) => void
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
