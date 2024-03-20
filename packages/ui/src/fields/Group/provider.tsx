'use client'
import React, { createContext, useContext } from 'react'

export const GroupContext = createContext(false)

export const GroupProvider: React.FC<{ children?: React.ReactNode; withinGroup?: boolean }> = ({
  children,
  withinGroup = true,
}) => {
  return <GroupContext.Provider value={withinGroup}>{children}</GroupContext.Provider>
}

export const useGroup = (): boolean => useContext(GroupContext)
