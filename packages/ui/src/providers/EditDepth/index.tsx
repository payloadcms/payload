'use client'
import React, { createContext, useContext } from 'react'

export const EditDepthContext = createContext(0)

type Props = {
  readonly children: React.ReactNode
  readonly depth: number
}

export function EditDepthProvider({ children, depth = 1 }: Props) {
  return <EditDepthContext.Provider value={depth}>{children}</EditDepthContext.Provider>
}

export const useEditDepth = (): number => useContext(EditDepthContext)
