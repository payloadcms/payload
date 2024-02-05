'use client'
import React, { createContext, useContext } from 'react'

import { ComponentMap } from '../../forms/utilities/buildComponentMap/types'

const ComponentMapContext = createContext<ComponentMap>({} as ComponentMap)

export const ComponentMapProvider: React.FC<{
  children: React.ReactNode
  componentMap: ComponentMap
}> = ({ children, componentMap }) => {
  return (
    <ComponentMapContext.Provider value={componentMap}>{children}</ComponentMapContext.Provider>
  )
}

export const useComponentMap = (): ComponentMap => useContext(ComponentMapContext)
