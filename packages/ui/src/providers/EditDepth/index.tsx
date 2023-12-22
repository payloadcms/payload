'use client'
import React, { createContext, useContext } from 'react'

export const EditDepthContext = createContext(0)

export const EditDepthProvider: React.FC<{ depth: number; children: React.ReactNode }> = ({
  children,
  depth,
}) => <EditDepthContext.Provider value={depth}>{children}</EditDepthContext.Provider>

export const useEditDepth = (): number => useContext(EditDepthContext)
