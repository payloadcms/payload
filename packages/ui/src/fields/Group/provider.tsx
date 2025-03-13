'use client'
import React, { createContext, use } from 'react'

export const GroupContext = createContext(false)

export const GroupProvider: React.FC<{ children?: React.ReactNode; withinGroup?: boolean }> = ({
  children,
  withinGroup = true,
}) => {
  return <GroupContext value={withinGroup}>{children}</GroupContext>
}

export const useGroup = (): boolean => use(GroupContext)
