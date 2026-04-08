'use client'
import React, { createContext, use } from 'react'

export const EditDepthContext = createContext(0)

export const EditDepthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const parentDepth = useEditDepth()
  const depth = parentDepth + 1

  return <EditDepthContext value={depth}>{children}</EditDepthContext>
}

export const useEditDepth = (): number => use(EditDepthContext)
