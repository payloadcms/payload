'use client'
import React, { createContext, useContext } from 'react'

export const EditDepthContext = createContext(0)

export const EditDepthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const parentDepth = useEditDepth()
  const depth = parentDepth + 1

  return <EditDepthContext.Provider value={depth}>{children}</EditDepthContext.Provider>
}

export const useEditDepth = (): number => useContext(EditDepthContext)
