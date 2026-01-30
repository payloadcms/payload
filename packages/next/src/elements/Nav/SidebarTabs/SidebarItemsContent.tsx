'use client'

import React from 'react'

import { useSidebarItemsContext } from './SidebarItemsProvider.js'

export const SidebarItemsContent: React.FC = () => {
  const { activeContent, isLoading } = useSidebarItemsContext()

  return <>{isLoading ? null : activeContent}</>
}
