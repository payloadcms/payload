'use client'

import React, { createContext, use } from 'react'

import type { UseSidebarItemsReturn } from './useSidebarItems.js'

import { useSidebarItems } from './useSidebarItems.js'

type SidebarItemsContextType = UseSidebarItemsReturn

const SidebarItemsContext = createContext<null | SidebarItemsContextType>(null)

export type SidebarItemsProviderProps = {
  children: React.ReactNode
  initialActiveID: string
  initialContents: Record<string, React.ReactNode>
}

export const SidebarItemsProvider: React.FC<SidebarItemsProviderProps> = ({
  children,
  initialActiveID,
  initialContents,
}) => {
  const sidebarItems = useSidebarItems({
    initialActiveID,
    initialContents,
  })

  return <SidebarItemsContext value={sidebarItems}>{children}</SidebarItemsContext>
}

export const useSidebarItemsContext = (): SidebarItemsContextType => {
  const context = use(SidebarItemsContext)
  if (!context) {
    throw new Error('useSidebarItemsContext must be used within SidebarItemsProvider')
  }
  return context
}
