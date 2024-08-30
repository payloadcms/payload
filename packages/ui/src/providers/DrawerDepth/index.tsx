'use client'
import React, { createContext, useContext } from 'react'

export const DrawerDepthContext = createContext(0)

type Props = {
  readonly children: React.ReactNode
}
export function DrawerDepthProvider({ children }: Props) {
  const parentDepth = useDrawerDepth()
  const value = parentDepth + 1
  return <DrawerDepthContext.Provider value={value}>{children}</DrawerDepthContext.Provider>
}

export const useDrawerDepth = (): number => useContext(DrawerDepthContext)
