'use client'
import React, { createContext, useContext } from 'react'

export const EditDepthContext = createContext(0)

type Props = {
  readonly children: React.ReactNode
}

export function EditDepthProvider({ children }: Props) {
  const parentDepth = useEditDepth()
  const value = parentDepth + 1
  return <EditDepthContext.Provider value={value}>{children}</EditDepthContext.Provider>
}

export const useEditDepth = (): number => useContext(EditDepthContext)
